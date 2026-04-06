from rest_framework import serializers
from django.utils import timezone

from shared.models import TOSReport
from users.serializers import ProfileSerializer

from .models import TOS, TOSComment, TOSRow, TOSTemplate
from syllabi.models import Syllabus, SyllabusCourseOutline
from academics.models import Course, Program
from bayanihan.models import BayanihanGroup
from users.models import User

from bayanihan.serializers import BayanihanGroupReadSerializer
from syllabi.serializers import SyllabusCourseOutcomeReadSerializer, SyllabusCourseOutlineReadSerializer

import math 

class TOSTemplateSerializer(serializers.ModelSerializer):  
    class Meta:
        model = TOSTemplate
        fields = [
            "id", "revision_no", "effective_date", "description",
            "header_image", "is_active", "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "revision_no", "is_active", "created_at", "updated_at"]

    # ✅ On create, deactivate old active templates and activate new one
    def create(self, validated_data): 
        # Auto-increment revision_no number
        # last_template = TOSTemplate.objects.filter(is_active=True).order_by("-revision_no").first()
        # next_revision_no = (last_template.revision_no + 1) if last_template else 0
        # validated_data["revision_no"] = next_revision_no

        # Deactivate any currently active template
        TOSTemplate.objects.filter(is_active=True).update(is_active=False)

        # Automatically set the new one as active 
        template = TOSTemplate.objects.create(is_active=True, **validated_data) 

        return template
    
    
class TOSCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used by POST /tos/ to create a draft v1 tos
    and auto-populate chair & TOSRow fields.
    """ 
    syllabus_id = serializers.PrimaryKeyRelatedField(
        queryset=Syllabus.objects.all(),
        source="syllabus",
        write_only=True
    )
    selected_topics = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=True,
        help_text="Array of selected syllabus topics"
    )

    class Meta:
        model = TOS
        fields = [
            "id",
            # write-only inputs for creation 
            "syllabus_id", 

            # user-entered fields
            "term",
            "total_items",
            "col1_percentage",
            "col2_percentage",
            "col3_percentage",
            "col4_percentage", 
            "tos_cpys", 
            "selected_topics",

            # readonly auto / derived 
            "status",
            "version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "version", "created_at", "updated_at"]
        
    def validate_selected_topics(self, value):
        if not value:
            raise serializers.ValidationError("You must select at least one topic.")
        return value

    def validate(self, attrs): 
        syllabus = attrs.get("syllabus")
        term = attrs.get("term") 

        # Check uniqueness per syllabus + term
        if TOS.objects.filter(syllabus=syllabus, term=term).exists():
            raise serializers.ValidationError(
                f"A TOS for syllabus {syllabus.bayanihan_group.course.course_code} ({syllabus.bayanihan_group.school_year}) and term {term} already exists."
            )
        
        if not TOSTemplate.objects.filter(is_active=True).exists():
            raise serializers.ValidationError(
                "A Template for the TOS doesn't exist, please inform Admin to create a template first."
            )

        # Validate percentages sum to 100
        total_pct = (
            attrs.get("col1_percentage", 0)
            + attrs.get("col2_percentage", 0)
            + attrs.get("col3_percentage", 0)
            + attrs.get("col4_percentage", 0)
        )
        if total_pct != 100:
            raise serializers.ValidationError("Percentages must sum to 100.")
        
        if attrs.get("col1_percentage", 0) > 50:
            raise serializers.ValidationError("Knowledge must not go beyond 50%.")
            
        return attrs

    def create(self, validated_data):  
        from collections import defaultdict

        # helper: biggest-remainder floor + distribute leftover by fractional part
        def largest_remainder_allocate(floats, target):
            """
            Floats: list of nonnegative floats (length N)
            target: integer total to allocate (<= sum(ceil(floats))) 
            Returns: list of integers summing to target using largest remainder method.
            """
            n = len(floats)
            floored = [math.floor(x) for x in floats]
            assigned = sum(floored)
            leftover = target - assigned

            # fractional parts (value, index)
            fracs = sorted(
                [(floats[i] - floored[i], i) for i in range(n)],
                key=lambda x: (-x[0], x[1])
            )
            for k in range(leftover):
                idx = fracs[k % n][1]
                floored[idx] += 1
            return floored

        request = self.context["request"]
        user = request.user
        syllabus = validated_data.pop("syllabus")
        selected_topics = validated_data.pop("selected_topics", [])

        bg = syllabus.bayanihan_group
        course = bg.course
        curriculum = course.curriculum
        program = curriculum.program
        status = "Draft"
        version = 1

        tos_template = (
            TOSTemplate.objects.filter(is_active=True)
            .order_by("-revision_no")
            .first()
        )

        # create tos
        tos = TOS.objects.create(
            tos_template=tos_template,
            syllabus=syllabus,
            user=user,
            bayanihan_group=bg,
            course=course,
            program=program,
            effective_date=tos_template.effective_date if tos_template else None,
            status=status,
            version=version,
            chair=syllabus.chair,
            **validated_data,
        )

        total_items = tos.total_items

        # 1) global expected per column (largest-remainder)
        col_percentages = [
            tos.col1_percentage,
            tos.col2_percentage,
            tos.col3_percentage,
            tos.col4_percentage,
        ]
        raw_global = [total_items * (p / 100.0) for p in col_percentages]
        global_expected = largest_remainder_allocate(raw_global, total_items)
        tos.col1_expected, tos.col2_expected, tos.col3_expected, tos.col4_expected = global_expected
        tos.save()

        # 2) selected topic rows -> assign percent and items
        selected_entries = SyllabusCourseOutline.objects.filter(
            syllabus=syllabus,
            topics__in=selected_topics,
            syllabus_term=tos.term,
        )
        total_hours = sum(co.allotted_hour or 0 for co in selected_entries)

        row_infos = []
        for co in selected_entries:
            raw_pct = (co.allotted_hour / total_hours) * 100 if total_hours else 0
            raw_items = total_items * (raw_pct / 100.0)
            row_infos.append({
                "co": co,
                "raw_percent": raw_pct,
                "raw_items": raw_items,
            })

        # fix row percents to sum 100
        floored_percents = largest_remainder_allocate(
            [r["raw_percent"] for r in row_infos],
            100
        )

        # fix row items to sum total_items
        floored_items = largest_remainder_allocate(
            [r["raw_items"] for r in row_infos],
            total_items
        )

        # 3) build raw_ij matrix = ideal fractional allocation for each row i and column j
        n_rows = len(row_infos)
        m_cols = 4
        # raw_ij = row_items_i * (col_pct_j / 100)
        # Using column percentages or global_expected share results in equivalent proportions,
        # but to remain consistent we use percentages:
        raw_matrix = [[0.0]*m_cols for _ in range(n_rows)]
        for i in range(n_rows):
            ri = floored_items[i]
            for j in range(m_cols):
                raw_matrix[i][j] = ri * (col_percentages[j] / 100.0)

        # 4) initial integer matrix = floor(raw_matrix)
        int_matrix = [[math.floor(raw_matrix[i][j]) for j in range(m_cols)] for i in range(n_rows)]

        # compute current row sums and column sums
        row_sum = [sum(int_matrix[i]) for i in range(n_rows)]
        col_sum = [sum(int_matrix[i][j] for i in range(n_rows)) for j in range(m_cols)]

        # compute global_expected as integers (we computed earlier)
        target_col_sum = list(global_expected)
        target_row_sum = list(floored_items)

        # 5) Build list of candidate cells with fractional parts, sort by fractional desc
        cell_list = []
        for i in range(n_rows):
            for j in range(m_cols):
                frac = raw_matrix[i][j] - int_matrix[i][j]
                cell_list.append((frac, i, j))

        # Sort descending fractional, tie-break by row then col
        cell_list.sort(key=lambda x: (-x[0], x[1], x[2]))

        # 6) Assign leftover units iteratively to best fractional cells while respecting capacities:
        # capacities: row_sum[i] < target_row_sum[i] and col_sum[j] < target_col_sum[j]
        total_assigned = sum(sum(row) for row in int_matrix)
        total_target = total_items
        # We'll allocate until totals reach target_total (i.e., total_items)
        # but we must also ensure column sums reach target_col_sum.
        # We'll iterate over sorted cells repeatedly until no more assignment is possible.
        made_progress = True
        while total_assigned < total_target and made_progress:
            made_progress = False
            for idx in range(len(cell_list)):
                _, i, j = cell_list[idx]
                if total_assigned >= total_target:
                    break
                if row_sum[i] < target_row_sum[i] and col_sum[j] < target_col_sum[j]:
                    # we can allocate one unit here
                    int_matrix[i][j] += 1
                    row_sum[i] += 1
                    col_sum[j] += 1
                    total_assigned += 1
                    made_progress = True

        # After that loop, there may remain unassigned units (rare), try a fallback:
        if total_assigned < total_target:
            # fill by scanning rows with deficit and columns with deficit
            for i in range(n_rows):
                for j in range(m_cols):
                    while total_assigned < total_target and row_sum[i] < target_row_sum[i] and col_sum[j] < target_col_sum[j]:
                        int_matrix[i][j] += 1
                        row_sum[i] += 1
                        col_sum[j] += 1
                        total_assigned += 1

        # 7) Final check — if any row_sum != target_row_sum or col_sum != target_col_sum, we have an allocation failure
        for i in range(n_rows):
            if row_sum[i] != target_row_sum[i]:
                raise ValueError(f"Allocation failed: row {i} sum {row_sum[i]} != expected {target_row_sum[i]}")

        for j in range(m_cols):
            if col_sum[j] != target_col_sum[j]:
                raise ValueError(f"Allocation failed: column {j} sum {col_sum[j]} != expected {target_col_sum[j]}")

        # 8) Create TOSRow objects using int_matrix
        rows = []
        for i, rinfo in enumerate(row_infos):
            co = rinfo["co"]
            rows.append(TOSRow(
                tos=tos,
                topic=co.topics,
                no_hours=co.allotted_hour or 0,
                percent=floored_percents[i],
                no_items=floored_items[i],
                col1_value=int_matrix[i][0],
                col2_value=int_matrix[i][1],
                col3_value=int_matrix[i][2],
                col4_value=int_matrix[i][3],
            ))

        TOSRow.objects.bulk_create(rows)

        # 9) report and return
        TOSReport.objects.create(bayanihan_group=bg, tos=tos, version=version)
        return tos
    
    
class TOSUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an existing TOS.
    When updating, removes old TOSRows and recreates based on selected_topics.
    """
    selected_topics = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=True,
        help_text="Array of selected syllabus topics"
    )

    class Meta:
        model = TOS
        fields = [
            "id",

            # updatable fields
            "term",
            "total_items",
            "col1_percentage",
            "col2_percentage",
            "col3_percentage",
            "col4_percentage",
            "tos_cpys",
            "selected_topics",

            # readonly
            "status",
            "version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "version", "created_at", "updated_at"]
        
    def validate_selected_topics(self, value):
        if not value:
            raise serializers.ValidationError("You must select at least one topic.")
        return value

    def validate(self, attrs):
        instance: TOS = self.instance 

        # percentages sum to 100
        total_pct = (
            attrs.get("col1_percentage", instance.col1_percentage)
            + attrs.get("col2_percentage", instance.col2_percentage)
            + attrs.get("col3_percentage", instance.col3_percentage)
            + attrs.get("col4_percentage", instance.col4_percentage)
        )
        if total_pct != 100:
            raise serializers.ValidationError("Percentages must sum to 100.")

        if attrs.get("col1_percentage", instance.col1_percentage) > 50:
            raise serializers.ValidationError("Knowledge must not go beyond 50%.")

        return attrs

    def update(self, instance, validated_data):
        from collections import defaultdict

        def largest_remainder_allocate(floats, target):
            """Largest remainder allocation"""
            n = len(floats)
            floored = [math.floor(x) for x in floats]
            assigned = sum(floored)
            leftover = target - assigned

            fracs = sorted(
                [(floats[i] - floored[i], i) for i in range(n)],
                key=lambda x: (-x[0], x[1])
            )
            for k in range(leftover):
                idx = fracs[k % n][1]
                floored[idx] += 1
            return floored

        # Pop selected topics
        selected_topics = validated_data.pop("selected_topics", [])

        # Update instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        total_items = instance.total_items

        # -------------------------------
        # Step 1: Compute global expected column allocation
        # -------------------------------
        col_percentages = [
            instance.col1_percentage,
            instance.col2_percentage,
            instance.col3_percentage,
            instance.col4_percentage,
        ]
        raw_global = [total_items * (p / 100.0) for p in col_percentages]
        global_expected = largest_remainder_allocate(raw_global, total_items)
        instance.col1_expected, instance.col2_expected, instance.col3_expected, instance.col4_expected = global_expected
        instance.save()

        # -------------------------------
        # Step 2: Prepare row data for selected topics
        # -------------------------------
        selected_entries = SyllabusCourseOutline.objects.filter(
            syllabus=instance.syllabus,
            topics__in=selected_topics,
            syllabus_term=instance.term,
        )
        total_hours = sum(co.allotted_hour or 0 for co in selected_entries)

        row_infos = []
        for co in selected_entries:
            raw_pct = (co.allotted_hour / total_hours) * 100 if total_hours else 0
            raw_items = total_items * (raw_pct / 100.0)
            row_infos.append({
                "co": co,
                "raw_percent": raw_pct,
                "raw_items": raw_items,
            })

        floored_percents = largest_remainder_allocate([r["raw_percent"] for r in row_infos], 100)
        floored_items = largest_remainder_allocate([r["raw_items"] for r in row_infos], total_items)

        # -------------------------------
        # Step 3: Build raw matrix and floor it
        # -------------------------------
        n_rows = len(row_infos)
        m_cols = 4
        raw_matrix = [[0.0]*m_cols for _ in range(n_rows)]
        for i in range(n_rows):
            ri = floored_items[i]
            for j in range(m_cols):
                raw_matrix[i][j] = ri * (col_percentages[j] / 100.0)

        int_matrix = [[math.floor(raw_matrix[i][j]) for j in range(m_cols)] for i in range(n_rows)]
        row_sum = [sum(int_matrix[i]) for i in range(n_rows)]
        col_sum = [sum(int_matrix[i][j] for i in range(n_rows)) for j in range(m_cols)]

        target_row_sum = list(floored_items)
        target_col_sum = list(global_expected)

        # -------------------------------
        # Step 4: Largest remainder per-cell allocation
        # -------------------------------
        cell_list = []
        for i in range(n_rows):
            for j in range(m_cols):
                frac = raw_matrix[i][j] - int_matrix[i][j]
                cell_list.append((frac, i, j))
        cell_list.sort(key=lambda x: (-x[0], x[1], x[2]))

        total_assigned = sum(sum(row) for row in int_matrix)
        total_target = total_items
        made_progress = True
        while total_assigned < total_target and made_progress:
            made_progress = False
            for _, i, j in cell_list:
                if total_assigned >= total_target:
                    break
                if row_sum[i] < target_row_sum[i] and col_sum[j] < target_col_sum[j]:
                    int_matrix[i][j] += 1
                    row_sum[i] += 1
                    col_sum[j] += 1
                    total_assigned += 1
                    made_progress = True

        # Fallback allocation if leftover units remain
        if total_assigned < total_target:
            for i in range(n_rows):
                for j in range(m_cols):
                    while total_assigned < total_target and row_sum[i] < target_row_sum[i] and col_sum[j] < target_col_sum[j]:
                        int_matrix[i][j] += 1
                        row_sum[i] += 1
                        col_sum[j] += 1
                        total_assigned += 1

        # -------------------------------
        # Step 5: Final consistency check
        # -------------------------------
        for i in range(n_rows):
            if row_sum[i] != target_row_sum[i]:
                raise ValueError(f"Allocation failed: row {i} sum {row_sum[i]} != expected {target_row_sum[i]}")
        for j in range(m_cols):
            if col_sum[j] != target_col_sum[j]:
                raise ValueError(f"Allocation failed: column {j} sum {col_sum[j]} != expected {target_col_sum[j]}")

        # -------------------------------
        # Step 6: Create TOSRow objects
        # -------------------------------
        instance.tos_rows.all().delete()
        rows = []
        for i, rinfo in enumerate(row_infos):
            co = rinfo["co"]
            rows.append(
                TOSRow(
                    tos=instance,
                    topic=co.topics,
                    no_hours=co.allotted_hour or 0,
                    percent=floored_percents[i],
                    no_items=floored_items[i],
                    col1_value=int_matrix[i][0],
                    col2_value=int_matrix[i][1],
                    col3_value=int_matrix[i][2],
                    col4_value=int_matrix[i][3],
                )
            )

        TOSRow.objects.bulk_create(rows)
        return instance


# TOS Retrieve Versions Serializer   
class TOSVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TOS
        fields = [
            "id", 
            "term",
            "status", 
            "version", 
            "chair_submitted_at", 
            "chair_returned_at",
            "chair_approved_at",  
        ] 
        read_only_fields = ["id", "status", "version"]


# TOS Table List Serializer
class CourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["course_code", "course_title", "course_year_level", "course_semester"]

class BayanihanListGroupSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = BayanihanGroup
        fields = ["id", "school_year", "course"]
        
class TOSListSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanListGroupSerializer(read_only=True)

    class Meta:
        model = TOS
        fields = [
            "id", 
            "term",
            "bayanihan_group",
            "chair_submitted_at",
            "chair_approved_at",
            "status",
            "version",
        ]
    

# TOS Retrieve Serializer
class SyllabusReadSerializer(serializers.ModelSerializer): 
    course_outcomes = SyllabusCourseOutcomeReadSerializer(many=True, read_only=True)
    course_outlines = SyllabusCourseOutlineReadSerializer(many=True, read_only=True)
    class Meta:
        model = Syllabus
        fields = "__all__"
        
class UserReadSeralizer(serializers.ModelSerializer):  
    class Meta:
        model = User
        fields = "__all__"
        
class CourseReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"
        
class ProgramReadSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Program
        fields = "__all__" 
        
class TOSRowReadSerializers(serializers.ModelSerializer):  
    class Meta:
        model = TOSRow
        fields = "__all__"
        
class TOSDetailSerializer(serializers.ModelSerializer): 
    tos_template = TOSTemplateSerializer(read_only=True)
    syllabus = SyllabusReadSerializer(read_only=True)
    user = UserReadSeralizer(read_only=True)
    course = CourseReadSerializer(read_only=True)
    bayanihan_group = BayanihanGroupReadSerializer(read_only=True) 
    program = ProgramReadSerializer(read_only=True)
    
    tos_rows = TOSRowReadSerializers(read_only=True, many=True)
    
    is_latest = serializers.SerializerMethodField()

    class Meta:
        model = TOS
        fields = "__all__" 

    def get_is_latest(self, obj):
        latest_version = (
            TOS.objects.filter(
                bayanihan_group_id=obj.bayanihan_group_id, 
                term=obj.term
            ).order_by("-version")
            .values_list("version", flat=True)
            .first()
        )
        return obj.version == latest_version
        
        
class TOSRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TOSRow
        fields = [
            "id", "topic", "no_hours", "percent", "no_items",
            "col1_value", "col2_value", "col3_value", "col4_value",
        ]
    
    
class TOSCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True) 
    user = ProfileSerializer(read_only=True)
    # Include tos_row_id for clear serialization of the foreign key
    tos_row_id = serializers.PrimaryKeyRelatedField(
        source='tos_row', 
        queryset=TOSRow.objects.all(), 
        write_only=True, 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = TOSComment
        fields = [
            "id",
            "tos",
            "user",
            "user_name",
            "tos_row",          # Used for reading (will be serialized as object if needed)
            "tos_row_id",       # Used for writing (setting the FK)
            "text",
            "is_resolved",
            "resolved_at",
            "created_at",
            "resolved_at",
        ] 
        read_only_fields = ["id", "user", "user_name", "tos_row", "created_at"]
        
    def create(self, validated_data):
        # Extract the TOSRow instance from the write-only field, if present
        tos_row_instance = validated_data.pop('tos_row', None)
        if tos_row_instance:
            validated_data['tos_row'] = tos_row_instance

        return super().create(validated_data)
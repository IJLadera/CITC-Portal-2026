from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from django.db import transaction

from .models import BayanihanGroup, BayanihanGroupUser
from .signals import notify_user_added_to_group
from academics.models import Course
from academics.serializers import CourseSerializer   
from users.models import User, Role, UserRole
from users.serializers import UserRoleSerializer


# Create (and sometimes read nested) BayanihanGroup Serializer
class UserSerializer(serializers.ModelSerializer):
    user_roles = UserRoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "prefix", "suffix", "phone", "user_roles", "signature"
        ]
    
class BayanihanGroupUserReadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BayanihanGroupUser
        fields = ["id", "user", "role", "created_at", "updated_at"]

class BayanihanGroupSerializer(serializers.ModelSerializer): 
    course = CourseSerializer(read_only=True)
    bayanihan_members = BayanihanGroupUserReadSerializer(many=True, read_only=True)
 
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), 
        source="course", 
        write_only=True
    )
    leader_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
        help_text="List of User IDs to assign as leaders for this Bayanihan group"
    )
    teacher_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
        help_text="List of User IDs to assign as teachers for this Bayanihan group"
    )

    class Meta:
        model = BayanihanGroup
        fields = [
            "id", "school_year", "course", "course_id",
            "bayanihan_members", "created_at", "updated_at",
            "leader_ids", "teacher_ids",
        ]

    # Validation for Unique Bayanihan Group (school_year + course)
    def validate(self, attrs):
        course = attrs.get("course") or getattr(self.instance, "course", None)
        school_year = attrs.get("school_year") or getattr(self.instance, "school_year", None)
        leader_ids = set(attrs.get("leader_ids", []))
        teacher_ids = set(attrs.get("teacher_ids", []))
        instance = getattr(self, "instance", None)

        errors = {} 
        
        overlap = leader_ids & teacher_ids
        if overlap: 
            errors["non_field_errors"] = [
                f"A user cannot be both a leader and a teacher in the same group."
            ]
            
        if course and school_year:
            existing = BayanihanGroup.objects.filter(course=course, school_year=school_year)

            # Exclude self when updating
            if instance:
                existing = existing.exclude(id=instance.id)

            if existing.exists():
                errors["non_field_errors"] = [
                    f"A Bayanihan group for the course '{course}' and school year '{school_year}' already exists."
                ]

        # ✅ Prevent duplicate leader/teacher within each role
        if len(leader_ids) != len(attrs.get("leader_ids", [])):
            errors["leader_ids"] = ["Duplicate leader IDs are not allowed."]
        if len(teacher_ids) != len(attrs.get("teacher_ids", [])):
            errors["teacher_ids"] = ["Duplicate teacher IDs are not allowed."]

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    def _sync_members(self, group, leader_users=None, teacher_users=None):
        """
        Sync BayanihanGroupUser by role. If list is None, skip syncing that role.
        If list is provided, it becomes the source of truth (add missing, remove extra).
        """
        if leader_users is not None:
            desired_leader_ids = {u.id for u in leader_users}
            existing_leaders = BayanihanGroupUser.objects.filter(group=group, role="LEADER")
            existing_leader_ids = set(existing_leaders.values_list("user_id", flat=True))
            to_add = desired_leader_ids - existing_leader_ids
            to_remove = existing_leader_ids - desired_leader_ids

            BayanihanGroupUser.objects.filter(
                group=group, role="LEADER", user_id__in=to_remove
            ).delete()
            new_leaders = [BayanihanGroupUser(group=group, user_id=uid, role="LEADER") for uid in to_add]
            BayanihanGroupUser.objects.bulk_create(new_leaders, ignore_conflicts=True)

            # Trigger notifications manually
            for member in new_leaders:
                notify_user_added_to_group(sender=BayanihanGroupUser, instance=member, created=True)


        if teacher_users is not None:
            desired_teacher_ids = {u.id for u in teacher_users}
            existing_teachers = BayanihanGroupUser.objects.filter(group=group, role="TEACHER")
            existing_teacher_ids = set(existing_teachers.values_list("user_id", flat=True))
            to_add = desired_teacher_ids - existing_teacher_ids
            to_remove = existing_teacher_ids - desired_teacher_ids

            BayanihanGroupUser.objects.filter(
                group=group, role="TEACHER", user_id__in=to_remove
            ).delete()
            new_teachers = [BayanihanGroupUser(group=group, user_id=uid, role="TEACHER") for uid in to_add]
            BayanihanGroupUser.objects.bulk_create(new_teachers, ignore_conflicts=True)

            # Trigger notifications manually
            for member in new_teachers:
                notify_user_added_to_group(sender=BayanihanGroupUser, instance=member, created=True)
    
    def _ensure_user_roles(self, user_ids, role_name):
        """
        Ensure each user has a UserRole for the given role name.
        """
        if not user_ids:
            return
        
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            raise serializers.ValidationError(f"Role {role_name} not found.")

        # Users that already have this role
        existing = set(
            UserRole.objects.filter(role=role, user_id__in=user_ids)
            .values_list("user_id", flat=True)
        )
        to_add = [UserRole(user_id=uid, role=role) for uid in user_ids if uid not in existing]

        UserRole.objects.bulk_create(to_add, ignore_conflicts=True)
        
    def _cleanup_user_roles(self, user_ids, role_name):
        if user_ids is None:
            return  # client did NOT intend to modify teachers/leaders

        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            raise serializers.ValidationError(f"Role {role_name} not found.")
        
        for uid in user_ids:
            still_member = BayanihanGroupUser.objects.filter(user_id=uid, role=role_name.split("_")[1]).exists()
            if not still_member:
                UserRole.objects.filter(user_id=uid, role=role).delete()

    @transaction.atomic
    def create(self, validated_data):
        leaders = validated_data.pop("leader_ids", [])
        teachers = validated_data.pop("teacher_ids", [])

        group = BayanihanGroup.objects.create(**validated_data)

        # Add memberships
        leader_ids = list({u.id for u in leaders})
        teacher_ids = list({u.id for u in teachers})
        rows = (
            [BayanihanGroupUser(group=group, user_id=uid, role="LEADER") for uid in leader_ids] +
            [BayanihanGroupUser(group=group, user_id=uid, role="TEACHER") for uid in teacher_ids]
        )
        BayanihanGroupUser.objects.bulk_create(rows, ignore_conflicts=True)

        # Manually trigger notifications for the new instances
        for member in rows:
            notify_user_added_to_group(sender=BayanihanGroupUser, instance=member, created=True)

        # Ensure UserRoles are created
        self._ensure_user_roles(leader_ids, "BAYANIHAN_LEADER") 
        self._ensure_user_roles(teacher_ids, "BAYANIHAN_TEACHER")

        return group

    @transaction.atomic
    def update(self, instance, validated_data):
        leaders = validated_data.pop("leader_ids", None)
        teachers = validated_data.pop("teacher_ids", None)

        # Update group fields (school_year/course)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # Sync memberships (only if the corresponding list was provided)
        self._sync_members(
            instance,
            leader_users=leaders if leaders is not None else None,
            teacher_users=teachers if teachers is not None else None,
        )

        # Ensure + cleanup UserRoles
        if leaders is not None:
            leader_ids = [u.id for u in leaders]
            self._ensure_user_roles(leader_ids, "BAYANIHAN_LEADER")
            self._cleanup_user_roles(leader_ids, "BAYANIHAN_LEADER")

        if teachers is not None:
            teacher_ids = [u.id for u in teachers]
            self._ensure_user_roles(teacher_ids, "BAYANIHAN_TEACHER")
            self._cleanup_user_roles(teacher_ids, "BAYANIHAN_TEACHER")

        return instance
    
    
# Read BayanihanGroup Serializer (detailed nested info)
class CourseReadSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Course
        fields = "__all__"  
    
class BayanihanGroupReadSerializer(serializers.ModelSerializer):
    course = CourseReadSerializer(read_only=True)
    bayanihan_members = BayanihanGroupUserReadSerializer(many=True, read_only=True)
    
    class Meta:
        model = BayanihanGroup
        fields = [
            "id", "school_year", "course", "bayanihan_members", 
            "created_at", "updated_at", 
        ]
        

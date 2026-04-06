from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class BayanihanPagination(PageNumberPagination):
    page_size = 5  # default number of groups per page
    page_size_query_param = "page_size"  # allows ?page_size=5
    max_page_size = 50

    def paginate_queryset(self, queryset, request, view=None):
        # ✅ Disable pagination if ?all=true
        if request.query_params.get("all") == "true":
            return None
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return Response({
            "total_groups": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "groups": data,  # instead of “results”
        })  
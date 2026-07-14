from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Barcode, PrintPreset, Unit
from .serializers import BarcodeSerializer, PrintPresetSerializer, UnitSerializer
from .services import generate_barcode_name


class ThrottledTokenObtainPairView(TokenObtainPairView):
    # limits login attempts per IP address (brute-force protection); rate is
    # configured under REST_FRAMEWORK.DEFAULT_THROTTLE_RATES["login"]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.order_by("name")
    serializer_class = UnitSerializer
    http_method_names = ["get", "post", "head", "options"]


class PrintPresetViewSet(viewsets.ModelViewSet):
    queryset = PrintPreset.objects.order_by("name")
    serializer_class = PrintPresetSerializer
    http_method_names = ["get", "post", "head", "options"]


class BarcodeViewSet(viewsets.ModelViewSet):
    serializer_class = BarcodeSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = (
            Barcode.objects
            .select_related("unit", "created_by", "updated_by")
            .order_by("-created_at")
        )
        include_inactive = (
            self.request.query_params.get("include_inactive", "").lower() in ("true", "1")
        )
        # only the list is filtered: detail routes must still reach
        # inactive barcodes (e.g. to reactivate them with PATCH)
        if self.action == "list" and not include_inactive:
            queryset = queryset.filter(is_active=True)
        return queryset

    def perform_create(self, serializer):
        # atomic: the unit lock inside generate_barcode_name must be
        # held until the insert commits, or two requests could get the same number
        with transaction.atomic():
            serializer.save(
                created_by=self.request.user,
                name=generate_barcode_name(serializer.validated_data["unit"]),
            )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # DELETE never removes the row: archive records are only deactivated
        barcode = self.get_object()
        barcode.is_active = False
        barcode.updated_by = request.user
        barcode.save(update_fields=["is_active", "updated_by", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

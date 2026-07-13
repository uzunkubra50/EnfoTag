from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from barcodes.views import BarcodeViewSet, PrintPresetViewSet, UnitViewSet

router = DefaultRouter()
router.register("units", UnitViewSet)
router.register("barcodes", BarcodeViewSet, basename="barcode")
router.register("presets", PrintPresetViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/login" element={<div>login sayfası</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>korumalı içerik</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("token yokken login'e yönlendirir", () => {
    renderProtected();
    expect(screen.getByText("login sayfası")).toBeInTheDocument();
    expect(screen.queryByText("korumalı içerik")).not.toBeInTheDocument();
  });

  it("token varken korumalı içeriği gösterir", () => {
    localStorage.setItem("accessToken", "test-token");
    renderProtected();
    expect(screen.getByText("korumalı içerik")).toBeInTheDocument();
  });
});

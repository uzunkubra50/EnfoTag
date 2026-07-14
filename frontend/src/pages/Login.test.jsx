import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { login } from "../api/auth";
import Login from "./Login";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

function submitForm(username, password) {
  fireEvent.change(screen.getByLabelText("Kullanıcı Adı"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("Şifre"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));
}

describe("Login", () => {
  it("yanlış bilgide Türkçe hata mesajı gösterir", async () => {
    login.mockRejectedValueOnce({ response: { status: 401 } });
    renderLogin();
    submitForm("kubra", "yanlis-sifre");
    expect(
      await screen.findByText("Kullanıcı adı veya şifre hatalı.")
    ).toBeInTheDocument();
  });

  it("sunucuya ulaşılamayınca bağlantı hatası gösterir", async () => {
    login.mockRejectedValueOnce({ response: undefined });
    renderLogin();
    submitForm("kubra", "sifre");
    expect(await screen.findByText(/Sunucuya ulaşılamadı/)).toBeInTheDocument();
  });
});

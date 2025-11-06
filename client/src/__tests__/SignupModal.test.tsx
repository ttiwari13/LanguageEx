declare const global: any;
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupModal from "../pages/SignupModal";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "User registered successfully" }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("SignupModal", () => {
  test("renders all input fields", () => {
    render(
      <SignupModal isOpen={true} onClose={() => {}} onLoginClick={() => {}} />
    );

    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Choose a username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("example@email.com")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("••••••••")[0]).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  test("shows validation errors when fields are empty", async () => {
    render(
      <SignupModal isOpen={true} onClose={() => {}} onLoginClick={() => {}} />
    );

    const signupButton = screen.getByRole("button", { name: /sign up/i });
    await userEvent.click(signupButton);
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    render(
      <SignupModal isOpen={true} onClose={() => {}} onLoginClick={() => {}} />
    );
    await userEvent.type(screen.getByPlaceholderText("Enter your name"), "Tani");
    await userEvent.type(screen.getByPlaceholderText("Choose a username"), "tani007");
    await userEvent.type(screen.getByPlaceholderText("example@email.com"), "tani@example.com");
    const passwordFields = screen.getAllByPlaceholderText("••••••••");
    await userEvent.type(passwordFields[0], "password123");
    await userEvent.type(passwordFields[1], "password123");
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], "English");
    await userEvent.selectOptions(selects[1], "Spanish");

    const signupButton = screen.getByRole("button", { name: /sign up/i });
    await userEvent.click(signupButton);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/signup"),
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Object),
          body: expect.any(String),
        })
      )
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
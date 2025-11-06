declare const global: any;
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginModal from "../pages/LoginModal";
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Login successful",
          token: "fake-jwt-token",
        }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("LoginModal", () => {
  test("renders all input fields and buttons", () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );
    expect(
      screen.getByPlaceholderText("Enter your username")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2); 
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test("shows validation errors when fields are empty", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    await userEvent.click(loginButton);
    expect(
      await screen.findByText("Username is required")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Password is required")
    ).toBeInTheDocument();
  });

  test("clears error when user starts typing", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    await userEvent.click(loginButton);
    expect(
      await screen.findByText("Username is required")
    ).toBeInTheDocument();
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    await userEvent.type(usernameInput, "testuser");
    expect(screen.queryByText("Username is required")).not.toBeInTheDocument();
  });

  test("toggles password visibility", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );

    const passwordInput = screen.getByPlaceholderText(
      "••••••••"
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
    const toggleButtons = screen.getAllByRole("button");
    const eyeButton = toggleButtons.find(
      (button) => button.querySelector("svg") && button !== toggleButtons[0]
    );

    if (eyeButton) {
      await userEvent.click(eyeButton);
      expect(passwordInput.type).toBe("text");

      await userEvent.click(eyeButton);
      expect(passwordInput.type).toBe("password");
    }
  });

  test("submits form successfully with valid credentials", async () => {
    const mockOnClose = jest.fn();
    window.alert = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSignupClick={() => {}}
      />
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter your username"),
      "testuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "password123"
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    await userEvent.click(loginButton);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "password123",
          }),
        })
      )
    );
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
    });
    expect(window.alert).toHaveBeenCalledWith("Login successful! 🎉");
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles login failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            message: "Invalid credentials",
          }),
      })
    ) as jest.Mock;

    window.alert = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter your username"),
      "wronguser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "wrongpassword"
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    await userEvent.click(loginButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Login failed: Invalid credentials"
      );
    });
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("handles network error", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as jest.Mock;

    window.alert = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter your username"),
      "testuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "password123"
    );

    const loginButton = screen.getByRole("button", { name: /login/i });
    await userEvent.click(loginButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      );
    });
  });

  test("submits form on Enter key press", async () => {
    window.alert = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );

    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123{Enter}");
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/login"),
        expect.any(Object)
      );
    });
  });

  test("calls onSignupClick when Sign Up is clicked", async () => {
    const mockOnSignupClick = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onSignupClick={mockOnSignupClick}
      />
    );

    const signUpLink = screen.getByText(/sign up/i);
    await userEvent.click(signUpLink);

    expect(mockOnSignupClick).toHaveBeenCalled();
  });

  test("calls onClose when close button is clicked", async () => {
    const mockOnClose = jest.fn();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSignupClick={() => {}}
      />
    );

    const closeButton = screen.getAllByRole("button")[0]; 
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("does not render when isOpen is false", () => {
    const { container } = render(
      <LoginModal
        isOpen={false}
        onClose={() => {}}
        onSignupClick={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
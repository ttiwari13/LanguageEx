const request = require("supertest");
const express = require("express");
const userController = require("../controllers/userController");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
jest.mock("../models/User");
jest.mock("jsonwebtoken");
jest.mock("bcryptjs");
jest.mock("../configs/db", () => ({
  connect: jest.fn().mockResolvedValue({
    release: jest.fn(),
  }),
  query: jest.fn(),
}));

const app = express();
app.use(express.json());
app.post("/signup", userController.signup);
app.post("/login", userController.login);

describe("User Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should signup successfully and return token", async () => {
    User.getUserByEmail.mockResolvedValueOnce(null);
    User.createUser.mockResolvedValueOnce({
      id: 1,
      name: "Tani",
      username: "tani_007",
      email: "tani@example.com",
      offering_language: "English",
      seeking_language: "French",
    });
    bcrypt.hash.mockResolvedValueOnce("hashedpassword");
    jwt.sign.mockReturnValue("fakeToken123");

    const res = await request(app)
      .post("/signup")
      .send({
        name: "Tani",
        username: "tani_007",
        email: "tani@example.com",
        password: "password123",
        offering_language: "English",
        seeking_language: "French",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe("tani@example.com");
    expect(res.body.token).toBe("fakeToken123");
  });

  test("should fail if user already exists", async () => {
    User.getUserByEmail.mockResolvedValueOnce({ id: 1 });
    const res = await request(app)
      .post("/signup")
      .send({ email: "existing@example.com" });
    expect(res.statusCode).toBe(400);
  });

  test("should login successfully without password in response", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: "hashedpassword",
      name: "Tani",
    };

    User.getUserByEmail.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValue("fakeToken123");

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBe("fakeToken123");
  });
});

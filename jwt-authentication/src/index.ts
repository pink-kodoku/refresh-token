import { RefreshToken } from "./entity/RefreshToken";
import { Database } from "./database";
import { RegisterDTO } from "./dto/request/register.dto";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entity/User";
import * as express from "express";
import { PasswordHash } from "./security/passwordhash";
import { AuthenticationDTO } from "./dto/response/authentication.dto";
import { UserDTO } from "./dto/response/user.dto";
import { JWT } from "./security/jwt";
import { LoginDTO } from "./dto/request/login.dto";
import { EntityToDTO } from "./util/EntityToDTO";
import { RefreshTokenDTO } from "./dto/request/refreshToken.dto";
import * as cors from "cors";
import * as jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cors());
Database.initialize();

const auth = (req: express.Request, res: express.Response, next) => {
  let token = req.headers["authorization"];
  token = token.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "token does not provide" });
  }
  jwt.verify(token, "secret", async (err, user) => {
    if (user) {
      // @ts-ignore
      req.user = user;
      next();
    } else if (err.message === "jwt expired") {
      return res.json({
        success: false,
        message: "Access token expired",
      });
    } else {
      return res.status(403).json({
        err,
        message: "User not authenticated",
      });
    }
  });
};

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello world");
});

app.post("/register", async (req: express.Request, res: express.Response) => {
  try {
    const body: RegisterDTO = req.body;

    // validate the body
    if (body.password !== body.repeatPassword) {
      throw new Error("Repeat password does not match the password");
    }

    // validate if the email is already being used
    if (await Database.userRepository.findOne({ email: body.email })) {
      throw new Error("email is already being used");
    }
    // store the user
    const user = new User();
    user.username = body.username;
    user.email = body.email;
    user.password = await PasswordHash.hashPassword(body.password);
    user.age = body.age;

    await Database.userRepository.save(user);
    const authenticationDTO: AuthenticationDTO = new AuthenticationDTO();
    const userDTO: UserDTO = EntityToDTO.userToDTO(user);

    const tokenAndRefreshToken = await JWT.generateTokenAndRefreshToken(user);
    authenticationDTO.user = userDTO;
    authenticationDTO.token = tokenAndRefreshToken.token;
    authenticationDTO.refreshToken = tokenAndRefreshToken.refreshToken;

    // implement token generation and refresh tokens
    res.json(authenticationDTO);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const body: LoginDTO = req.body;
    // check if the email/user exists
    const user = await Database.userRepository.findOne({ email: body.email });
    if (!user) {
      throw new Error("User does not exists");
    }
    // check if the password is valid
    if (!(await PasswordHash.isPasswordValid(body.password, user.password))) {
      throw new Error("Password is invalid");
    }

    const { token, refreshToken } = await JWT.generateTokenAndRefreshToken(
      user
    );
    // generate an authenticationDTO/resposne
    const authenticationDTO = new AuthenticationDTO();
    authenticationDTO.user = EntityToDTO.userToDTO(user);
    authenticationDTO.token = token;
    authenticationDTO.refreshToken = refreshToken;

    res.json(authenticationDTO);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/protected", auth, (req, res) => {
  res.send("<h1>Protected route</h1>");
});

app.post(
  "/refresh/token",
  async (req: express.Request, res: express.Response) => {
    try {
      const { refreshToken }: RefreshTokenDTO = req.body;

      // generate a fresh pair of token and refresh token
      // @ts-ignore
      jwt.verify(refreshToken, "secret", async (err, user) => {
        if (!err) {
          const newUser = await Database.userRepository.findOne({
            // @ts-ignore
            email: user.email,
          });
          const tokenResults = await JWT.generateTokenAndRefreshToken(newUser);
          res.json({
            token: tokenResults.token,
            refreshToken: tokenResults.refreshToken,
          });
        } else {
          res.json({ message: "Cant not generate refresh token" });
        }
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

app.listen(4000, () => console.log("Listening on port ", 4000));

createConnection()
  .then(async (connection) => {})
  .catch((error) => console.log(error));

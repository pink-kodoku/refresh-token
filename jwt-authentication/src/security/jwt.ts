import * as jwt from "jsonwebtoken";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import { Database } from "../database";
export class JWT {
  private static JWT_SECRET = "secret";

  public static async generateTokenAndRefreshToken(user: User) {
    // specify a payload thats hold the users and email
    const payload = {
      id: user.id,
      email: user.email,
    };
    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: "20s", // specify when does the token expires 1hour
    });

    // create refresh tokne
    const refreshToken = await this.generateRefreshToken(user);

    return { token, refreshToken };
  }

  private static async generateRefreshToken(user: User) {
    const payload = {
      email: user.email,
    };
    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: "1d", // specify when does the token expires 1hour
    });
    // create a new record of refresh token
    const refreshToken = new RefreshToken();
    refreshToken.user = user;
    //store this refresh token
    await Database.refreshTokenRepository.save(refreshToken);
    return token;
  }

  public static isTokenValid(token: string) {
    try {
      if (
        jwt.verify(token, this.JWT_SECRET, {
          ignoreExpiration: false,
        })
      )
        return true;
    } catch (error) {
      return false;
    }
  }
}

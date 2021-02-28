import * as bcrypt from "bcrypt";
export class PasswordHash {
  public static async hashPassword(plainPassword: string) {
    /**
     * @returns Returns a hashed password
     * @param plainPassword Plain password
     */
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    return hashedPassword;
  }
  public static async isPasswordValid(
    plainPassword: string,
    hashedPassword: string
  ) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

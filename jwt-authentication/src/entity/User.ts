import { RefreshToken } from "./RefreshToken";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  age: number;

  @OneToMany((type) => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: any;
}

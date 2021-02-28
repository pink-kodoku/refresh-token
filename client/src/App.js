import React, { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const body = {
        email,
        password,
      };
      const {
        data: { token, refreshToken },
      } = await axios.post("http://localhost:4000/login", body);
      Cookies.set("access", token);
      Cookies.set("refresh", refreshToken);
    } catch (error) {
      console.log(error);
    }
  };
  const requestLogin = async (accessToken, refreshToken) => {
    console.log(accessToken, refreshToken);
    return new Promise((resolve, reject) => {
      axios
        .get("http://localhost:4000/protected", {
          headers: { authorization: `Bearer ${accessToken}` },
        })
        .then(async (data) => {
          if (data.data.success === false) {
            if (data.data.message === "User not authenticated") {
              setErr("Login again");
              // set err message to login again.
            } else if (data.data.message === "Access token expired") {
              const accessToken = await refresh(refreshToken);
              return await requestLogin(accessToken, refreshToken);
            }

            resolve(false);
          } else {
            // protected route has been accessed, response can be used.
            setErr("Protected route accessed!");
            resolve(true);
          }
        });
    });
  };
  const refresh = (refreshToken) => {
    console.log("Refreshing token!");

    return new Promise((resolve, reject) => {
      axios
        .post("http://localhost:4000/refresh/token", {
          refreshToken,
        })
        .then((data) => {
          if (data.data.success === false) {
            setErr("Login again");
            // set message and return.
            resolve(false);
          } else {
            const { token } = data.data;
            Cookies.set("access", token);
            resolve(token);
          }
        });
    });
  };
  const hasAccess = async (accessToken, refreshToken) => {
    if (!refreshToken) return null;

    if (accessToken === undefined) {
      // generate new accessToken
      accessToken = await refresh(refreshToken);
      return accessToken;
    }

    return accessToken;
  };
  const protect = async (e) => {
    let accessToken = Cookies.get("access");
    let refreshToken = Cookies.get("refresh");

    accessToken = await hasAccess(accessToken, refreshToken);

    if (!accessToken) {
      // Set message saying login again.
    } else {
      await requestLogin(accessToken, refreshToken);
    }
  };

  return (
    <div className="App">
      <form action="" onSubmit={submitHandler}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <input type="submit" value="login" />
      </form>
      {err}
      <button onClick={protect}>Access Protected Content</button>
    </div>
  );
}

export default App;

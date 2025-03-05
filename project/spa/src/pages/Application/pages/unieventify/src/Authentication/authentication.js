import * as React from "react";
import { Grid, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SignIn from "./Login/signin";
import SignUp from "./Register/signup";

const defaultTheme = createTheme();

export default function Authentication() {
  const [isSignIn, setIsSignIn] = React.useState(true);

  const toggleForm = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid
        container
        component="main"
        sx={{
          color: "white",
          backgroundImage: `url(${require("../images/bgimage.jpg")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <CssBaseline />
        <Grid item xs={false} sm={4} md={6} lg={8} sx={{}} />
        {isSignIn ? (
          <SignIn toggleForm={toggleForm} />
        ) : (
          <SignUp toggleForm={toggleForm} />
        )}
      </Grid>
    </ThemeProvider>
  );
}

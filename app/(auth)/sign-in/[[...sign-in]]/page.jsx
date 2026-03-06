import { SignIn } from "@clerk/nextjs";
import React from "react";

const SignInPage = () => {
  return (
    <div>
      {/* Redirects to our custom API route after successful login */}
      <SignIn forceRedirectUrl="/api/auth/sync" />
    </div>
  );
};

export default SignInPage;

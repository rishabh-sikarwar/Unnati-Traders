import { SignUp } from "@clerk/nextjs";
import React from "react";

const SignUpPage = () => {
  return (
    <div>
      {/* Redirects to our custom API route after successful signup */}
      <SignUp forceRedirectUrl="/api/auth/sync" />
    </div>
  );
};

export default SignUpPage;

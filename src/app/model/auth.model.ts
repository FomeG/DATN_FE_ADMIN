export interface LoginResponse {
    responseCode: number;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      roles: string[];

      userId: string;
      userName: string;
      displayName: string;
    };

  }
  
  export interface LoginRequest {
    userName: string;  // Match với SignInReq.cs
    passWord: string; // Match với SignInReq.cs 
  }
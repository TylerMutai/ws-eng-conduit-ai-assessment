export interface User {
  email: string;
  token: string;
  username: string;
  bio: string;
  image: string;
}

export interface UserNoAuth {
  id: number;
  email: string;
  username: string;
  bio: string;
  image: string;
}

export interface UserResponse {
  user: User;
}

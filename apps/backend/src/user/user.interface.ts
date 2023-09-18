export interface IUserData {
  bio: string;
  email: string;
  image?: string;
  token: string;
  username: string;
}

export interface IUserDataNoAuth {
  id: number;
  bio: string;
  email: string;
  image?: string;
  username: string;
}

export interface IUserRO {
  user: IUserData;
}

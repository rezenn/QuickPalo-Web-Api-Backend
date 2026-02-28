// import { OAuth2Client } from "google-auth-library";
// import { UserRepository } from "../../repositories/user.repository";
// import { HttpError } from "../../errors/http-error";
// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "../../configs";

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const userRepository = new UserRepository();

// export class GoogleService {
//   async loginWithGoogle(data: {
//     idToken: string;
//     email: string;
//     fullName: string;
//     profilePicture?: string;
//   }) {
//     const { idToken, email, fullName, profilePicture } = data;

//     let payload: any;
//     try {
//       const ticket = await client.verifyIdToken({
//         idToken,
//         audience: process.env.GOOGLE_CLIENT_ID,
//       });
//       payload = ticket.getPayload();
//     } catch {
//       throw new HttpError(401, "Invalid Google token");
//     }

//     if (!payload || payload.email !== email) {
//       throw new HttpError(401, "Google token email mismatch");
//     }

//     let user = await userRepository.getUserByEmail(email);

//     if (!user) {
//       user = await userRepository.createUser({
//         fullName: fullName || payload.name,
//         email,
//         phoneNumber: "",
//         password: "", 
//         profilePicture: profilePicture || payload.picture || "",
//         googleId: payload.sub,
//         isGoogleUser: true,
//         role: "user",
//       });
//     } else {
//       if (!(user as any).googleId) {
//         await userRepository.updateUser((user as any)._id.toString(), {
//           googleId: payload.sub,
//           isGoogleUser: true,
//           ...(!user.profilePicture && profilePicture ? { profilePicture } : {}),
//         } as any);
//       }
//     }

//     const tokenPayload = {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//     };
//     const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

//     return { token, user };
//   }
// }

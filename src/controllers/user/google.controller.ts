// import { Request, Response } from "express";
// import { GoogleService } from "../../services/user/google.service";

// const googleService = new GoogleService();

// export class GoogleController {
//   async loginWithGoogle(req: Request, res: Response) {
//     try {
//       const { idToken, email, fullName, profilePicture } = req.body;

//       if (!idToken || !email) {
//         return res.status(400).json({
//           success: false,
//           message: "idToken and email are required",
//         });
//       }

//       const { token, user } = await googleService.loginWithGoogle({
//         idToken,
//         email,
//         fullName,
//         profilePicture,
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Login successful",
//         token,
//         data: {
//           _id: user._id,
//           fullName: user.fullName,
//           email: user.email,
//           phoneNumber: user.phoneNumber,
//           profilePicture: user.profilePicture,
//           role: user.role,
//         },
//       });
//     } catch (error: any) {
//       return res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || "Google Sign-In failed",
//       });
//     }
//   }
// }

import { getCurrentUser } from '@reshuffle/server-function';

// Example of accessing and validating user with
//
// /* @expose */
// export async function getUserId() {
//   // this will fail if the request doesn't contain a user
//   const user = getCurrentUser(true);
//   return user && user.id;
// }

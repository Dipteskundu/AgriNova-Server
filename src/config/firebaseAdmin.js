const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
let authInstance;

function getFirebaseAuth() {
  if (authInstance) return authInstance;
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
    catch { throw Object.assign(new Error("Firebase service account configuration is invalid."), { statusCode: 503 }); }
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || serviceAccount?.project_id;
  if (!projectId) throw Object.assign(new Error("Firebase authentication is not configured."), { statusCode: 503 });
  const app = getApps().find((candidate) => candidate.name === "agrinova-auth") || initializeApp({
    projectId,
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  }, "agrinova-auth");
  authInstance = getAuth(app);
  return authInstance;
}
module.exports = { getFirebaseAuth };

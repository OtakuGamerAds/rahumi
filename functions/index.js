const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define the secret
const githubPat = defineSecret("GITHUB_PAT");

/**
 * Cloud Function: triggerGitHubAction
 * 
 * Securely triggers the GitHub Action to rebuild the site.
 * Only authenticated users can call this function.
 * The GitHub PAT is stored as a Firebase secret, never exposed to clients.
 */
exports.triggerGitHubAction = onCall(
    { 
        secrets: [githubPat],
        cors: true 
    },
    async (request) => {
        // 1. Verify authentication
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be logged in to trigger a publish."
            );
        }

        // 2. Get the secret PAT
        const pat = githubPat.value();
        if (!pat) {
            throw new HttpsError(
                "failed-precondition",
                "GitHub PAT not configured."
            );
        }

        // 3. Trigger the GitHub Action
        const owner = "OtakuGamerAds";
        const repo = "redirect";
        const workflowFile = "build-from-firebase.yml";

        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${pat}`,
                        "Accept": "application/vnd.github.v3+json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ref: "main" })
                }
            );

            if (!response.ok && response.status !== 204) {
                const errorText = await response.text();
                console.error("GitHub API error:", response.status, errorText);
                throw new HttpsError(
                    "internal",
                    "Failed to trigger GitHub Action."
                );
            }

            console.log(`GitHub Action triggered by user: ${request.auth.uid}`);
            return { success: true, message: "GitHub Action triggered successfully!" };

        } catch (error) {
            console.error("Error triggering GitHub Action:", error);
            if (error instanceof HttpsError) throw error;
            throw new HttpsError(
                "internal",
                "Error triggering GitHub Action."
            );
        }
    }
);

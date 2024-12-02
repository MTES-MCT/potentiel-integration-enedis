import { getLogger } from "./logger.js";

export function getHealthcheckClient(healthcheckUrl?: string) {
  if (!healthcheckUrl)
    return {
      async start() {},
      async success() {},
      async error() {},
    };

  const notify = async (status: string) => {
    const url = new URL(healthcheckUrl);
    url.searchParams.set("status", status);
    try {
      await fetch(url);
    } catch (e) {
      getLogger().error(`Healtcheck failed: ${e}`);
    }
  };

  return {
    start: () => notify("in_progress"),
    success: () => notify("ok"),
    error: () => notify("error"),
  };
}

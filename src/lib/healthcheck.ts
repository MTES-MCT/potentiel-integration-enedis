import { getLogger } from "./logger.js";

export function getHealthcheckClient(
  healthcheckUrl: string | undefined,
  enviroment: string,
) {
  if (!healthcheckUrl)
    return {
      async start() {},
      async success() {},
      async error() {},
    };

  const uuid = crypto.randomUUID();
  const notify = async (status: string) => {
    const url = new URL(healthcheckUrl);
    url.searchParams.set("check_in_id", uuid);
    url.searchParams.set("status", status);
    url.searchParams.set("environment", enviroment);

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

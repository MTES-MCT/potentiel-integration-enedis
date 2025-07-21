type Stat = Record<string | symbol, number>;
export const createStats = () => {
  return new Proxy({} as Stat, {
    get(target, key) {
      return target[key] ?? 0;
    },
  });
};

export const mergeStats = ({ stats, into }: { into: Stat; stats: Stat }) => {
  for (const [prop, value] of Object.entries(stats)) {
    into[prop] ??= 0;
    into[prop] += value;
  }
};

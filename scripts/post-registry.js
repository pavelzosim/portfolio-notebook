(() => {
  const cache = new Map();

  window.atlasFetchRegistry = (url) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        fetch(url, { cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error(`Registry ${url} returned ${response.status}`);
            return response.json();
          })
          .catch((error) => {
            cache.delete(url);
            throw error;
          })
      );
    }
    return cache.get(url);
  };
})();

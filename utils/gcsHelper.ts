export const fetchGCSFiles = async (bucket: string) => {
  try {
    const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucket}/o`);
    const data = await response.json();

    if (data.items) {
      return data.items.map((item: any) => ({
        name: item.name,
        url: `https://storage.googleapis.com/${bucket}/${item.name}`,
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching GCS files:", error);
    return [];
  }
};

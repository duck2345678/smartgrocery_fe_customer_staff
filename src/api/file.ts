import apiClient from './client';

export const fileApi = {
  /**
   * Multipart Upload as requested by Tech Lead.
   * Efficiently handles large images from the camera.
   */
  upload: async (fileUri: string): Promise<{ url: string }> => {
    const formData = new FormData();
    
    // In React Native, we need to provide a blob-like object for FormData
    const filename = fileUri.split('/').pop() ?? 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    const filePart = {
      uri: fileUri,
      name: filename,
      type,
    };
    formData.append('file', filePart as unknown as Blob);

    const response = await apiClient.post<{ url: string }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

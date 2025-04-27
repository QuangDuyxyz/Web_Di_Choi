export interface PostAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string; // Cho video
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface PostLike {
  userId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  attachments: PostAttachment[];
  likes: PostLike[];
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PostWithComments extends Post {
  comments: PostComment[];
}

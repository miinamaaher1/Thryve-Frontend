import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../../Services/post.service';
import { PostAggregationResponse } from '../../../../Interfaces/post/post-aggrigation-response';
import { CommentModalComponent } from '../../../Shared/comment-modal/comment-modal.component';
import { EditPostComponent } from '../../../Shared/edit-post/edit-post.component';
import { CommentService } from '../../../../Services/comment.service';
import { GetPagedCommentRequest } from '../../../../Interfaces/Comment/get-paged-comment-request';
import { MediaType } from '../../../../Interfaces/Comment/media-enum-type';
import { FormsModule } from '@angular/forms';
import { ReactionService } from '../../../../Services/reaction.service';
import { RouterModule } from '@angular/router';
import { DeletePostRequest } from '../../../../Interfaces/post/delete-post-request';

@Component({
  selector: 'app-profile-posts',
  templateUrl: './profile-posts.component.html',
  styleUrls: ['./profile-posts.component.scss'],
  standalone: true,
  imports: [CommonModule, CommentModalComponent, EditPostComponent, FormsModule, RouterModule]
})
export class ProfilePostsComponent implements OnInit {
  userId: string = localStorage.getItem('userId') || '';
  isLoading: boolean = false;
  error: string | null = null;
  posts: PostAggregationResponse[] = [];
  selectedComments: any[] = [];
  selectedReactions: any[] = [];
  showModal: boolean = false;
  modalMode: 'comments' | 'reactions' = 'comments';
  nextPage: string = '1';
  selectedPostId: string | null = null;
  newCommentText: string = '';
  modalLoading: boolean = false;
  showEditModal: boolean = false;
  selectedPost: PostAggregationResponse | null = null;

  constructor(
    private postService: PostService,
    private commentService: CommentService,
    private reactionService: ReactionService
  ) {}

  openCommentsModal(postId: string) {
    this.selectedPostId = postId;
    this.modalMode = 'comments';
    this.showModal = true;
    this.selectedComments = [];
    this.selectedReactions = [];
    this.loadComments(postId);
  }

  private loadComments(postId: string) {
    this.modalLoading = true;
    const req: GetPagedCommentRequest = {
      PostId: postId,
      Next: ""
    };
    this.commentService.GetCommentList(req).subscribe({
      next: (data) => {
        this.selectedComments = data.data;
        this.modalLoading = false;
      },
      error: (err) => {
        this.modalLoading = false;
        console.error('Error loading comments:', err);
      }
    });
  }

  onCloseModal() {
    this.showModal = false;
    this.selectedPostId = null;
    this.selectedComments = [];
    this.selectedReactions = [];
    this.modalLoading = false;
  }

  onCommentSubmitted(newComment: any) {
    // Add the new comment to the top of the list
    this.selectedComments.unshift(newComment);

    // Find the post and update its comment count
    const post = this.posts.find(p => p.postId === this.selectedPostId);
    if (post) {
      post.numberOfComments = (post.numberOfComments || 0) + 1;
    }
  }

  onCommentDeleted() {
    const post = this.posts.find(p => p.postId === this.selectedPostId);
    if (post && post.numberOfComments > 0) {
      post.numberOfComments--;
    }
  }

  ngOnInit(): void {
    if (!this.userId) {
      console.error('User ID is required to load profile posts');
      return;
    }
    this.loadProfilePosts();
  }
  loadProfilePosts(): void {
    this.isLoading = true;
    this.error = null;
    this.postService.GetProfilePosts(this.userId, this.nextPage)
      .subscribe({
        next: (response) => {
          console.log('Profile posts response:', response);
          this.posts = (response.data || []).map((post: any) => ({
            ...post,
            media: (post.media || []).map((media: any) => ({
              ...media,
              Type: media.Type !== undefined ? media.Type : media.type,
              Url: media.Url !== undefined ? media.Url : media.url
            }))
          }));
          this.nextPage = response.next;
          this.error = null;
          this.isLoading = false;
          console.log('Loaded posts:', this.posts);
        },
        error: (error) => {
          this.posts = [];
          console.error('Error loading posts:', error);
          this.error = 'Failed to load posts. Please try again.';
          this.isLoading = false;
        }
      });
  }

  loadMore(): void {
    if (this.nextPage) {
      this.loadProfilePosts();
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  openReactionsModal(postId: string): void {
    this.selectedPostId = postId;
    this.modalMode = 'reactions';
    this.showModal = true;
    this.modalLoading = true;
    this.reactionService.getUsersReacted({ PostId: postId, Next: '' }).subscribe({
      next: (data) => {
        this.selectedReactions = data.data;
        this.modalLoading = false;
      },
      error: (err) => {
        this.modalLoading = false;
        console.error('Error loading reactions:', err);
      }
    });
  }

  isCurrentUserPost(post: PostAggregationResponse): boolean {
    return post.authorId === this.userId;
  }

  // Track which post's dropdown is open
  dropdownOpenPostId: string | null = null;

  toggleDropdown(post: PostAggregationResponse): void {
    if (this.dropdownOpenPostId === post.postId) {
      this.dropdownOpenPostId = null;
    } else {
      this.dropdownOpenPostId = post.postId;
    }
  }

  editPost(post: PostAggregationResponse): void {
    this.selectedPost = post;
    this.showEditModal = true;
    this.dropdownOpenPostId = null;
  }

  // Delete modal state
  showDeleteModal: boolean = false;
  isDeleting: boolean = false;
  postToDelete: PostAggregationResponse | null = null;

  deletePost(post: PostAggregationResponse): void {
    this.postToDelete = post;
    this.showDeleteModal = true;
    this.dropdownOpenPostId = null; // Close the dropdown
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.postToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.postToDelete || this.isDeleting) return;

    this.isDeleting = true;
    const deletePostRequest: DeletePostRequest = {
      postId: this.postToDelete.postId
    };

    this.postService.DeletePost(deletePostRequest).subscribe({
      next: (response) => {
        if (response.data) {
          // Remove the post from the posts array
          this.posts = this.posts.filter(p => p.postId !== this.postToDelete?.postId);
          this.showDeleteModal = false;
        }
        this.isDeleting = false;
        this.postToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.isDeleting = false;
      }
    });
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if the click was outside the dropdown and its trigger button
    if (!target.closest('.dropdown-container')) {
      this.closeDropdowns();
    }
  }

  closeDropdowns(): void {
    this.dropdownOpenPostId = null;
  }

  onCloseEditModal(): void {
    this.showEditModal = false;
    this.selectedPost = null;
  }

  onPostUpdated(updatedPost: PostAggregationResponse): void {
    const index = this.posts.findIndex(p => p.postId === updatedPost.postId);
    if (index !== -1) {
      this.posts[index] = { ...this.posts[index], ...updatedPost };
    }
    this.onCloseEditModal();
  }

  toggleLike(post: PostAggregationResponse) {
    if (post.isLikeLoading) return; // Prevent double-clicking while loading
    
    // Set loading state
    post.isLikeLoading = true;
    
    if (!post.isLiked) {
      // Optimistic UI update for like
      post.isLiked = true;
      post.numberOfLikes = (post.numberOfLikes || 0) + 1;
      
      // Call API
      this.reactionService.addReaction({ postId: post.postId }).subscribe({
        next: (response) => {
          if (response.statusCode === 200 || response.statusCode === 201) {
            post.isLikeLoading = false;
          } else {
            // Rollback UI if status code indicates failure
            post.isLiked = false;
            post.numberOfLikes = Math.max(0, (post.numberOfLikes || 1) - 1);
            post.isLikeLoading = false;
          }
        },
        error: () => {
          // Rollback UI if error
          post.isLiked = false;
          post.numberOfLikes = Math.max(0, (post.numberOfLikes || 1) - 1);
          post.isLikeLoading = false;
        }
      });
    } else {
      // Optimistic UI update for unlike
      post.isLiked = false;
      post.numberOfLikes = Math.max(0, (post.numberOfLikes || 1) - 1);
      
      // Call API
      this.reactionService.deleteReaction({ postId: post.postId }).subscribe({
        next: (response) => {
          if (response.statusCode === 200 || response.statusCode === 204) {
            post.isLikeLoading = false;
          } else {
            // Rollback UI if status code indicates failure
            post.isLiked = true;
            post.numberOfLikes = (post.numberOfLikes || 0) + 1;
            post.isLikeLoading = false;
          }
        },
        error: () => {
          // Rollback UI if error
          post.isLiked = true;
          post.numberOfLikes = (post.numberOfLikes || 0) + 1;
          post.isLikeLoading = false;
        }
      });
    }
  }
}

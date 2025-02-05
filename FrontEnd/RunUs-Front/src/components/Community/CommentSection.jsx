import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../styles/Community/CommentSection.css";
import "../../styles/MyPage/MyPageTier.css";
import { UserContext } from "../../hooks/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faTimes } from "@fortawesome/free-solid-svg-icons";

// 티어 정보
const tiers = [
  { name: "Unranked", min: 0, max: 49, color: "tier-unranked" },
  { name: "Bronze", min: 50, max: 349, color: "tier-bronze" },
  { name: "Silver", min: 350, max: 999, color: "tier-silver" },
  { name: "Gold", min: 1000, max: 1999, color: "tier-gold" },
  { name: "Platinum", min: 2000, max: 4999, color: "tier-platinum" },
  { name: "Diamond", min: 5000, max: Infinity, color: "tier-diamond" },
];

// 티어를 결정하는 함수
const determineTier = (exp) => {
  return tiers.find(tier => exp >= tier.min && exp <= tier.max) || tiers[0];
};

const CommentSection = ({ articleId, tierColor }) => {
  const { userData } = useContext(UserContext);
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [dropdownCommentId, setDropdownCommentId] = useState(null);

  const textareaRef = useRef(null);

  const fetchComments = async (pageNumber = 0) => {
    try {
      const response = await axios.get(`/api/v1/boards/comments`, {
        params: { boardId: articleId, size, page: pageNumber }
      });
      if (response.data && response.data.data) {
        if (response.data.data.length < size) {
          setHasMoreComments(false);
        }
        setCommentList((prevComments) => {
          const newComments = [...prevComments, ...response.data.data];
          const uniqueComments = Array.from(new Set(newComments.map(comment => comment.commentId)))
              .map(id => {
                return newComments.find(comment => comment.commentId === id);
              });
          return uniqueComments;
        });
      } else {
        console.error("댓글 데이터가 없습니다.");
      }
    } catch (err) {
      console.error("댓글 로드 실패: ", err);
    }
  };

  useEffect(() => {
    fetchComments(page);
  }, [articleId, page]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 일단 높이를 'auto'로 설정
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 콘텐츠 높이에 맞게 조정
    }
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
    autoResizeTextarea(); // 입력값이 변경될 때마다 높이 조절
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/v1/boards/comments`, {
        content: newComment,
        userId: userData.userId,
        boardId: articleId,
        parentId: replyingTo
      });
      setNewComment("");
      setReplyingTo(null);
      setPage(0);
      setCommentList([]);
      await fetchComments();
    } catch (err) {
      console.error("댓글 작성 실패: ", err);
    }
  };

  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
    setDropdownCommentId(null);
  };

  const handleUpdateComment = async (commentId) => {
    try {
      await axios.put(`/api/v1/boards/comments`, {
        commentId,
        content: editingContent,
      });
      setEditingCommentId(null);
      setEditingContent("");
      setPage(0);
      setCommentList([]);
      await fetchComments();
    } catch (err) {
      console.error("댓글 수정 실패: ", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/v1/boards/comments`, {
        data: { commentId },
      });
      setPage(0);
      setCommentList([]);
      await fetchComments();
    } catch (err) {
      console.error("댓글 삭제 실패: ", err);
    }
  };

  const loadMoreComments = () => {
    if (hasMoreComments) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleReply = (commentId, e) => {
    e.stopPropagation();
    setReplyingTo(commentId);
    setDropdownCommentId(null);
  };

  const toggleDropdown = (commentId) => {
    console.log('Toggling dropdown for commentId:', commentId); // 추가된 로그

    setDropdownCommentId(commentId);
    
  };

  const formatDate = (dateString) => {
    if (!dateString) return "미정";

    try {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      };
      return new Date(dateString).toLocaleString(undefined, options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return "형식 오류";
    }
  };

  const renderComments = (comments, parentId = null, level = 0) => {
    return comments
      .filter(comment => comment.parentId === parentId)
      .map(comment => {
        const commentTier = determineTier(comment.exp); // 댓글 티어 결정
        return(
        <div key={comment.commentId} className={level > 0 ? "nested-comment" : ""}>
          {editingCommentId === comment.commentId ? (
            <div className="comment-container">
              <textarea
                className="comment-writer"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
              />
              <button
                className="create-comment"
                onClick={() => handleUpdateComment(comment.commentId)}
              >
                수정 완료
              </button>
            </div>
          ) : (
            <div className="comment-container">
              <div className="comment-container2">
                <div className="tier-name-box">
                  <p className={`color-box-comment ${commentTier.color}`}>{commentTier.color.slice(5, 6).toUpperCase()}</p> {/* 티어 색상 클래스 적용 */}
                  <strong className="comment-nickname">{comment.nickname}</strong> 
                  <span className="date">{formatDate(comment.createdAt)}</span>
                </div>
              </div>
              <p>{comment.content}</p>
              {userData.userId === comment.userId && (
                <>
                  <button
                    className="menu-button"
                    onClick={() => toggleDropdown(comment.commentId)} 
                  >
                    ⋮
                  </button>
                  <div className={`comment-options ${dropdownCommentId === comment.commentId ? 'show' : ''}`}>
                    <button onClick={() => handleEditComment(comment.commentId, comment.content)}>
                      수정
                    </button>
                    <button onClick={() => handleDeleteComment(comment.commentId)}>
                      삭제
                    </button>
                  </div>
                </>
              )}
              <button onClick={(e) => handleReply(comment.commentId, e)} className="reply-button">답글 달기</button>
            </div>
          )}
          {renderComments(comments, comment.commentId, level + 1)}
        </div>
      );
      });
  };

  return (
    <div className="comment-section">
      <h3>댓글</h3>
      <ul className="comment-list-ul">
        {renderComments(commentList)}
      </ul>
      <form onSubmit={handleCommentSubmit}>
        <div className="textarea-container">
          <textarea
            ref={textareaRef}
            className="comment-writer"
            value={newComment}
            onChange={handleCommentChange}
            placeholder={replyingTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
          />
          <div className="submit-container">
            <button type="submit" className="create-comment">
              <FontAwesomeIcon icon={faArrowUp} />
            </button>
            {replyingTo && (
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="cancel-reply"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>
      </form>
      {hasMoreComments && (
        <div className="load-more-comments">
          <button onClick={loadMoreComments}>더보기</button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;

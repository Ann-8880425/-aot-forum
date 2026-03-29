// =====================
//   进击的巨人论坛 主逻辑
// =====================

// --- 全局状态 ---
let currentPage = 'home';
let posts = [];
let votes = {};
let currentReplyPostId = null;
let currentFilterCat = 'all';
let currentVoteFilter = 'all';
let currentSeason = 1;
let todayVoted = {};

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
  initData();
  renderHomePosts();
  renderCharPreview();
  renderVoteGrid();
  renderVoteRank();
  renderStoryContent(1);
  renderAnalysisGrid();
  renderTimeline();
  renderPosts();
  renderForumSidebar();
  setupEventListeners();
  setupScrollBtn();
});

function initData() {
  // 加载或初始化投票数据
  const savedVotes = localStorage.getItem('aot_votes');
  if (savedVotes) {
    votes = JSON.parse(savedVotes);
  } else {
    votes = {};
    AOT_DATA.characters.forEach(c => { votes[c.id] = c.votes; });
    saveVotes();
  }

  // 加载或初始化帖子
  const savedPosts = localStorage.getItem('aot_posts');
  if (savedPosts) {
    posts = JSON.parse(savedPosts);
  } else {
    posts = JSON.parse(JSON.stringify(AOT_DATA.defaultPosts));
    savePosts();
  }

  // 加载今日投票记录
  const today = new Date().toDateString();
  const savedToday = localStorage.getItem('aot_today_voted');
  const savedTodayDate = localStorage.getItem('aot_today_date');
  if (savedTodayDate === today && savedToday) {
    todayVoted = JSON.parse(savedToday);
  } else {
    todayVoted = {};
    localStorage.setItem('aot_today_date', today);
  }
}

function saveVotes() {
  localStorage.setItem('aot_votes', JSON.stringify(votes));
}

function savePosts() {
  localStorage.setItem('aot_posts', JSON.stringify(posts));
}

// --- 页面路由 ---
function goPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const pageEl = document.getElementById(page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupEventListeners() {
  // 导航点击
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goPage(link.dataset.page);
    });
  });

  // 投票过滤
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVoteFilter = btn.dataset.filter;
      renderVoteGrid();
    });
  });

  // 剧情季切换
  document.querySelectorAll('.story-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.story-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSeason = parseInt(tab.dataset.season);
      renderStoryContent(currentSeason);
    });
  });

  // 论坛分类
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterCat = btn.dataset.cat;
      renderPosts();
    });
  });

  // 发帖字数统计
  const postContent = document.getElementById('postContent');
  if (postContent) {
    postContent.addEventListener('input', () => {
      document.getElementById('charCount').textContent = `${postContent.value.length}/500`;
    });
  }
}

// --- 首页渲染 ---
function renderHomePosts() {
  const container = document.getElementById('homePosts');
  if (!container) return;
  const hot = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
  container.innerHTML = hot.map(p => `
    <div class="hot-post-card" onclick="openPostDetail(${p.id})">
      <div class="hot-post-cat">${getCatName(p.category)}</div>
      <h4>${p.title}</h4>
      <p>${p.content.substring(0, 80)}…</p>
      <div class="hot-post-meta">
        <span>👤 ${p.author}</span>
        <span>❤️ ${p.likes}</span>
        <span>💬 ${p.replies.length}</span>
        <span>👁️ ${p.views}</span>
      </div>
    </div>
  `).join('');
}

function renderCharPreview() {
  const container = document.getElementById('charPreview');
  if (!container) return;
  container.innerHTML = AOT_DATA.characters.slice(0, 8).map(c => `
    <div class="char-prev-card" style="--char-color:${c.color}" onclick="goPage('vote')">
      <div class="char-prev-emoji">${c.emoji}</div>
      <div class="char-prev-name">${c.name}</div>
      <div class="char-prev-votes">❤️ ${(votes[c.id] || c.votes).toLocaleString()}</div>
    </div>
  `).join('');
}

// --- 投票页渲染 ---
function renderVoteGrid() {
  const container = document.getElementById('voteGrid');
  if (!container) return;
  let chars = AOT_DATA.characters;
  if (currentVoteFilter !== 'all') {
    chars = chars.filter(c => c.faction === currentVoteFilter);
  }
  container.innerHTML = chars.map(c => {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    const charVotes = votes[c.id] || c.votes;
    const pct = totalVotes > 0 ? ((charVotes / totalVotes) * 100).toFixed(1) : 0;
    const voted = todayVoted[c.id];
    return `
    <div class="vote-card" style="--char-color:${c.color}">
      <div class="vote-card-header">
        <div class="vc-emoji">${c.emoji}</div>
        <div class="vc-info">
          <h4>${c.name}</h4>
          <p class="vc-jp">${c.nameJp}</p>
          <div class="vc-tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      </div>
      <p class="vc-desc">${c.desc}</p>
      <div class="vc-votes-bar">
        <div class="vc-bar-fill" style="width:${pct}%;background:${c.color}"></div>
      </div>
      <div class="vc-footer">
        <span class="vc-count">❤️ ${charVotes.toLocaleString()} 票 (${pct}%)</span>
        <button class="vote-btn ${voted ? 'voted' : ''}" onclick="voteFor(${c.id})" ${voted ? 'disabled' : ''}>
          ${voted ? '✅ 已投票' : '🗳️ 投票'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function renderVoteRank() {
  const container = document.getElementById('voteRankList');
  if (!container) return;
  const sorted = AOT_DATA.characters
    .map(c => ({ ...c, currentVotes: votes[c.id] || c.votes }))
    .sort((a, b) => b.currentVotes - a.currentVotes)
    .slice(0, 5);
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  container.innerHTML = sorted.map((c, i) => `
    <div class="vr-item">
      <span class="vr-medal">${medals[i]}</span>
      <span class="vr-emoji">${c.emoji}</span>
      <span class="vr-name">${c.name}</span>
      <span class="vr-num" style="color:${c.color}">${c.currentVotes.toLocaleString()}</span>
    </div>
  `).join('');
}

function voteFor(charId) {
  if (todayVoted[charId]) {
    showToast('今天已经投过票了，明天再来！');
    return;
  }
  votes[charId] = (votes[charId] || 0) + 1;
  todayVoted[charId] = true;
  saveVotes();
  localStorage.setItem('aot_today_voted', JSON.stringify(todayVoted));
  renderVoteGrid();
  renderVoteRank();
  renderCharPreview();
  showToast(`成功为 ${AOT_DATA.characters.find(c => c.id === charId)?.name} 投票！`);
}

// --- 剧情页渲染 ---
function renderStoryContent(season) {
  const container = document.getElementById('storyContent');
  if (!container) return;
  const s = AOT_DATA.seasons[season];
  if (!s) return;
  container.innerHTML = `
    <div class="season-card">
      <div class="season-header">
        <div class="season-badge">S${season}</div>
        <div>
          <h3>${s.title}</h3>
          <p>${s.year} · ${s.episodes}</p>
        </div>
      </div>
      <p class="season-summary">${s.summary}</p>
      <h4 class="events-title">⚡ 关键剧情节点</h4>
      <div class="events-list">
        ${s.keyEvents.map(e => `
          <div class="event-item">
            <div class="event-ep">${e.ep}</div>
            <div class="event-body">
              <h5>${e.title}</h5>
              <p>${e.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="season-analysis">
        <h4>🎯 剧情分析</h4>
        <p>${s.analysis}</p>
      </div>
    </div>
  `;
}

function renderAnalysisGrid() {
  const container = document.getElementById('analysisGrid');
  if (!container) return;
  container.innerHTML = AOT_DATA.themeAnalysis.map(t => `
    <div class="analysis-card" style="--theme-color:${t.color}">
      <div class="analysis-icon">${t.icon}</div>
      <h4>${t.title}</h4>
      <p>${t.content}</p>
    </div>
  `).join('');
}

// --- 时间轴渲染 ---
function renderTimeline() {
  const container = document.getElementById('timelineWrapper');
  if (!container) return;
  const typeColors = {
    origin: '#9b59b6', history: '#e67e22', main: '#2980b9',
    climax: '#e74c3c', end: '#27ae60'
  };
  const typeLabels = {
    origin: '起源', history: '历史', main: '主线', climax: '高潮', end: '终章'
  };
  container.innerHTML = `
    <div class="timeline">
      ${AOT_DATA.timeline.map((e, i) => `
        <div class="tl-item ${i % 2 === 0 ? 'tl-left' : 'tl-right'}">
          <div class="tl-dot" style="background:${typeColors[e.type]}"></div>
          <div class="tl-card">
            <div class="tl-meta">
              <span class="tl-year">${e.year}</span>
              <span class="tl-era">${e.era}</span>
              <span class="tl-type-badge" style="background:${typeColors[e.type]}">${typeLabels[e.type]}</span>
            </div>
            <h4>${e.title}</h4>
            <p>${e.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --- 论坛渲染 ---
function renderPosts() {
  const container = document.getElementById('postsList');
  if (!container) return;

  let filtered = currentFilterCat === 'all' ? posts : posts.filter(p => p.category === currentFilterCat);
  const sort = document.getElementById('sortSelect')?.value || 'time';
  if (sort === 'time') filtered.sort((a, b) => b.time - a.time);
  else if (sort === 'hot') filtered.sort((a, b) => b.replies.length - a.replies.length);
  else if (sort === 'likes') filtered.sort((a, b) => b.likes - a.likes);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无帖子，快来发表第一篇！</div>';
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="post-card" onclick="openPostDetail(${p.id})">
      <div class="post-card-top">
        <span class="post-cat-badge" style="background:${getCatColor(p.category)}">${getCatName(p.category)}</span>
        <span class="post-time">${timeAgo(p.time)}</span>
      </div>
      <h4 class="post-title">${p.title}</h4>
      <p class="post-preview">${p.content.substring(0, 120)}${p.content.length > 120 ? '…' : ''}</p>
      <div class="post-footer">
        <span class="post-author">👤 ${p.author}</span>
        <div class="post-actions-row">
          <button class="action-btn" onclick="event.stopPropagation();likePost(${p.id})">❤️ ${p.likes}</button>
          <span class="action-btn">💬 ${p.replies.length}</span>
          <span class="action-btn">👁️ ${p.views}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderForumSidebar() {
  // 统计
  const statsEl = document.getElementById('forumStats');
  if (statsEl) {
    const totalReplies = posts.reduce((a, p) => a + p.replies.length, 0);
    statsEl.innerHTML = `
      <div class="stat-row"><span>📝 总帖子</span><strong>${posts.length}</strong></div>
      <div class="stat-row"><span>💬 总回复</span><strong>${totalReplies}</strong></div>
      <div class="stat-row"><span>👥 今日访问</span><strong>${Math.floor(Math.random()*200)+100}</strong></div>
    `;
  }

  // 热门标签
  const tagsEl = document.getElementById('hotTags');
  if (tagsEl) {
    tagsEl.innerHTML = AOT_DATA.hotTags.map(t =>
      `<span class="forum-tag" onclick="searchTag('${t}')">#${t}</span>`
    ).join('');
  }

  // 活跃用户
  const usersEl = document.getElementById('activeUsers');
  if (usersEl) {
    usersEl.innerHTML = AOT_DATA.activeUsers.map(u => `
      <div class="active-user">
        <span class="au-emoji">${u.emoji}</span>
        <span class="au-name">${u.name}</span>
        <span class="au-posts">${u.posts}帖</span>
      </div>
    `).join('');
  }
}

function submitPost() {
  const author = document.getElementById('postAuthor').value.trim() || '匿名巨人迷';
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const category = document.getElementById('postCategory').value;

  if (!title) { showToast('请填写帖子标题！'); return; }
  if (!content) { showToast('请填写帖子内容！'); return; }

  const newPost = {
    id: Date.now(),
    author, title, content, category,
    time: Date.now(),
    likes: 0, views: 1,
    replies: []
  };

  posts.unshift(newPost);
  savePosts();

  document.getElementById('postAuthor').value = '';
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('charCount').textContent = '0/500';

  renderPosts();
  renderForumSidebar();
  renderHomePosts();
  showToast('帖子发布成功！');
}

function likePost(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.likes++;
    savePosts();
    renderPosts();
  }
}

function openPostDetail(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  post.views = (post.views || 0) + 1;
  savePosts();

  currentReplyPostId = postId;
  document.getElementById('postDetailTitle').textContent = post.title;

  const repliesHtml = post.replies.length > 0
    ? post.replies.map(r => `
      <div class="reply-item">
        <div class="reply-header">
          <span class="reply-author">👤 ${r.author}</span>
          <span class="reply-time">${timeAgo(r.time)}</span>
        </div>
        <p>${r.content}</p>
      </div>
    `).join('')
    : '<p class="no-replies">还没有回复，快来抢沙发！</p>';

  document.getElementById('postDetailBody').innerHTML = `
    <div class="post-detail-meta">
      <span class="post-cat-badge" style="background:${getCatColor(post.category)}">${getCatName(post.category)}</span>
      <span>👤 ${post.author}</span>
      <span>${timeAgo(post.time)}</span>
      <span>❤️ ${post.likes}</span>
      <span>👁️ ${post.views}</span>
    </div>
    <div class="post-detail-content">${post.content}</div>
    <div class="replies-section">
      <h5>💬 全部回复（${post.replies.length}）</h5>
      ${repliesHtml}
    </div>
    <div class="post-detail-actions">
      <button class="btn-primary" onclick="openReplyModal(${postId})">✍️ 回复</button>
      <button class="btn-secondary" onclick="likePost(${postId});this.textContent='❤️ 已点赞';this.disabled=true">❤️ 点赞</button>
    </div>
  `;

  document.getElementById('postDetailModal').classList.add('show');
}

function closePostDetail() {
  document.getElementById('postDetailModal').classList.remove('show');
  renderPosts();
}

function openReplyModal(postId) {
  currentReplyPostId = postId;
  document.getElementById('replyModal').classList.add('show');
}

function closeReplyModal() {
  document.getElementById('replyModal').classList.remove('show');
}

function submitReply() {
  const author = document.getElementById('replyAuthor').value.trim() || '匿名巨人迷';
  const content = document.getElementById('replyContent').value.trim();

  if (!content) { showToast('请填写回复内容！'); return; }

  const post = posts.find(p => p.id === currentReplyPostId);
  if (post) {
    post.replies.push({ author, content, time: Date.now() });
    savePosts();
    closeReplyModal();
    document.getElementById('replyAuthor').value = '';
    document.getElementById('replyContent').value = '';

    if (document.getElementById('postDetailModal').classList.contains('show')) {
      openPostDetail(currentReplyPostId);
    }
    renderPosts();
    renderForumSidebar();
    showToast('回复成功！');
  }
}

// 标签搜索
function searchTag(tag) {
  goPage('forum');
  // 简单实现：高亮显示包含该标签的帖子
  showToast(`搜索: #${tag}`);
}

// --- 工具函数 ---
function getCatName(cat) {
  const map = { general: '综合讨论', plot: '剧情分析', character: '角色讨论', theory: '脑洞理论', fan: '同人创作' };
  return map[cat] || cat;
}

function getCatColor(cat) {
  const map = { general: '#7f8c8d', plot: '#2980b9', character: '#8e44ad', theory: '#e67e22', fan: '#e91e8c' };
  return map[cat] || '#7f8c8d';
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  if (h < 24) return `${h}小时前`;
  return `${d}天前`;
}

function showToast(msg) {
  let toast = document.getElementById('toastMsg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function setupScrollBtn() {
  const btn = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

// 关闭弹窗点击外部
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeReplyModal();
    closePostDetail();
  }
});

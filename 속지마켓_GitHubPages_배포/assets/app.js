// 기존 메인 화면의 상품·채팅·인증 동작. 실제 서버 연결은 이후 단계입니다.
let selectedItemId = null;

        // --- 데이터 상태 관리 ---
        const CATEGORIES = ['전체', '📚 교재/도서', '👕 체육복/의류', '✏️ 학용품/문구', '🎧 전자기기', '🎁 기타'];
        
        let currentTab = 'market'; // 'market' or 'lost'
        let selectedCategory = '전체';
        let isFavoriteOnly = false;
        let activeChatRoomId = null;

        // 로컬스토리지 연동 데이터 초기화
        let items = JSON.parse(localStorage.getItem('sm_items')) || [];
        let favorites = JSON.parse(localStorage.getItem('sm_favorites')) || []; // item id 배열
        let chats = JSON.parse(localStorage.getItem('sm_chats')) || {}; // roomId: { id, itemId, partner, messages: [] }

        // 기본 상품 12개. 기존 사용자 상품·과거 거래·삭제 상태를 유지합니다.
        try{
          if(localStorage.getItem('sm_items')===null){
            items=SampleCatalog.fresh();
            saveItems();localStorage.setItem('sm_sample_catalog_v1','done');
          }else if(localStorage.getItem('sm_sample_catalog_v1')!=='done'){
            const updated=SampleCatalog.migrate(items);
            localStorage.setItem('sm_items',JSON.stringify(updated));items=updated;
            localStorage.setItem('sm_sample_catalog_v1','done');
          }
          if(localStorage.getItem('sm_sample_photo_v1')!=='done'){
            const updated=SampleCatalog.upgradePhotos(items);
            localStorage.setItem('sm_items',JSON.stringify(updated));items=updated;
            localStorage.setItem('sm_sample_photo_v1','done');
          }
        }catch(error){console.warn('기본 상품을 저장하지 못했습니다.',error);}

        // --- 앱 초기화 실행 ---
        window.onload = function() {
            updateAuthStatusUI();
            renderCategoryChips();
            renderItems();
            updateUnreadBadge();
        };

        function saveData(key, val) {
            localStorage.setItem(key, JSON.stringify(val));
        }

        function saveItems() { saveData('sm_items', items); }
        function saveFavorites() { saveData('sm_favorites', favorites); }
        function saveChats() { saveData('sm_chats', chats); }

        // --- 인증 관련 서비스 ---
        // --- 카테고리 & 탭 전환 기능 ---
        function switchTab(tab) {
            currentTab = tab;
            const marketBtn = document.getElementById('tab-market');
            const lostBtn = document.getElementById('tab-lost');

            if (tab === 'market') {
                marketBtn.className = "flex-1 py-3 text-center font-bold text-base md:text-lg border-b-2 border-sky-600 text-sky-600 transition";
                lostBtn.className = "flex-1 py-3 text-center font-bold text-base md:text-lg border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition";
            } else {
                lostBtn.className = "flex-1 py-3 text-center font-bold text-base md:text-lg border-b-2 border-sky-600 text-sky-600 transition";
                marketBtn.className = "flex-1 py-3 text-center font-bold text-base md:text-lg border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition";
            }
            renderItems();
        }

        function renderCategoryChips() {
            const container = document.getElementById('category-chips');
            container.innerHTML = CATEGORIES.map(cat => `
                <button onclick="selectCategory('${cat}')" class="px-3 py-1.5 rounded-xl border whitespace-nowrap transition font-medium ${selectedCategory === cat ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}">
                    ${cat}
                </button>
            `).join('');
        }

        function selectCategory(cat) {
            selectedCategory = cat;
            renderCategoryChips();
            renderItems();
        }

        function toggleFavoriteFilter() {
            isFavoriteOnly = !isFavoriteOnly;
            const btn = document.getElementById('favorite-filter-btn');
            const icon = document.getElementById('fav-icon');
            if (isFavoriteOnly) {
                btn.classList.add('bg-rose-500', 'text-white', 'border-rose-500');
                btn.classList.remove('bg-gray-50', 'text-gray-600');
                icon.innerText = '❤️';
            } else {
                btn.classList.remove('bg-rose-500', 'text-white', 'border-rose-500');
                btn.classList.add('bg-gray-50', 'text-gray-600');
                icon.innerText = '🤍';
            }
            renderItems();
        }

        function toggleFavorite(e, itemId) {
            e.stopPropagation();
            const index = favorites.indexOf(itemId);
            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(itemId);
            }
            saveFavorites();
            renderItems();
        }

        function resetFilters() {
            selectedCategory = '전체';
            isFavoriteOnly = false;
            document.getElementById('search-input').value = '';
            document.getElementById('sort-select').value = 'latest';
            renderCategoryChips();
            renderItems();
        }

        // --- 아이템 카드 렌더링 ---
        function renderItems() {
            const grid = document.getElementById('item-grid');
            const emptyState = document.getElementById('empty-state');
            const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
            const sortOption = document.getElementById('sort-select').value;

            let filtered = items.filter(item => item.type === currentTab);

            // 검색어 필터
            if (searchQuery) {
                filtered = filtered.filter(item => 
                    item.title.toLowerCase().includes(searchQuery) || 
                    item.desc.toLowerCase().includes(searchQuery) ||
                    item.zone.toLowerCase().includes(searchQuery)
                );
            }

            // 카테고리 필터
            if (selectedCategory !== '전체') {
                filtered = filtered.filter(item => item.category === selectedCategory);
            }

            // 찜한 상품만 보기 필터
            if (isFavoriteOnly) {
                filtered = filtered.filter(item => favorites.includes(item.id));
            }

            // 정렬
            if (sortOption === 'price-asc') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (sortOption === 'price-desc') {
                filtered.sort((a, b) => b.price - a.price);
            } else if (sortOption === 'free') {
                filtered = filtered.filter(item => item.price === 0);
            } else {
                filtered.sort((a, b) => b.createdAt - a.createdAt); // 최신순
            }

            if (filtered.length === 0) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            grid.innerHTML = filtered.map(item => {
                const isFav = favorites.includes(item.id);
                const priceDisplay = item.price === 0 ? '<span class="text-emerald-600 font-extrabold">무료나눔 🎁</span>' : `${item.price.toLocaleString()}원`;

                return `
                    <div onclick="openDetailModal(${item.id})" class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer relative flex flex-col justify-between group">
                        <!-- 찜하기 버튼 -->
                        <button onclick="toggleFavorite(event, ${item.id})" class="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm border border-gray-100 z-10 transition">
                            <span class="text-base">${isFav ? '❤️' : '🤍'}</span>
                        </button>

                        <div>
                            ${validProductPhoto(item.photo) ? `<img class="product-card-photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}" loading="lazy">` : '<div class="product-photo-placeholder"><span aria-hidden="true">📷</span><small>등록된 사진이 없습니다</small></div>'}
                            ${SampleCatalog.isGeneratedPhoto(item)?'<small class="sample-photo-note">AI 생성 · 상품 예시 사진</small>':''}
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-100">${escapeHtml(item.category)}</span>
                            </div>
                            <h3 class="font-bold text-gray-900 text-sm md:text-base group-hover:text-sky-600 transition line-clamp-2 mb-1">${escapeHtml(item.title)}</h3>
                            <p class="text-xs text-gray-500 line-clamp-2 mb-3">${escapeHtml(item.desc)}</p>
                        </div>

                        <div class="pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                            <div class="font-extrabold text-sm md:text-base text-gray-900">${priceDisplay}</div>
                            <div class="text-gray-400 font-medium truncate max-w-[100px]">📍 ${escapeHtml(item.zone)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // --- 1:1 실시간 대화/채팅 기능 ---
        function getChatRoomId(itemId, partnerName) {
            return `chat_${itemId}_${partnerName.replace(/\s+/g, '')}`;
        }

        function openChatModal(itemId, authorName) {
            if (!userAuth) {
                alert('1:1 대화를 나누려면 먼저 학교 인증을 완료해 주세요!');
                openAuthModal();
                return;
            }

            const item = items.find(i => i.id === itemId);
            if (!item) return;

            if ((item.ownerId && item.ownerId===userAuth.id) || userAuth.name === authorName) {
                alert('본인이 작성한 글입니다.');
                return;
            }

            const roomId = getChatRoomId(itemId, authorName);
            activeChatRoomId = roomId;

            if (!chats[roomId]) {
                chats[roomId] = {
                    id: roomId,
                    itemId: itemId,
                    itemTitle: item.title,
                    partner: authorName,
                    messages: [
                        { sender: 'system', text: `안전한 직거래를 위해 [${escapeHtml(item.zone)}] 이용을 권장합니다.`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
                    ]
                };
                saveChats();
            }

            document.getElementById('chat-input').value='';
            document.getElementById('chat-partner-name').innerText = authorName;
            document.getElementById('chat-item-title').innerText = item.title;
            renderChatMessages();
            document.getElementById('chat-modal').classList.remove('hidden');
        }

        function closeChatModal() {
            activeChatRoomId = null;
            document.getElementById('chat-modal').classList.add('hidden');
        }

        function renderChatMessages() {
            if (!activeChatRoomId || !chats[activeChatRoomId]) return;

            const container = document.getElementById('chat-messages');
            const room = chats[activeChatRoomId];

            container.innerHTML = room.messages.map(msg => {
                if (msg.sender === 'system') {
                    return `<div class="text-center text-[11px] text-gray-400 my-2">${escapeHtml(msg.text)}</div>`;
                }

                const isMe = msg.sender === userAuth.name;
                return `
                    <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1">
                        <div class="text-[10px] text-gray-400 mb-0.5">${escapeHtml(msg.sender)}</div>
                        <div class="max-w-[75%] px-3 py-2 rounded-2xl ${isMe ? 'bg-sky-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'} shadow-sm">
                            <p class="leading-relaxed">${escapeHtml(msg.text)}</p>
                        </div>
                        <span class="text-[9px] text-gray-400 mt-0.5">${escapeHtml(msg.time)}</span>
                    </div>
                `;
            }).join('');

            container.scrollTop = container.scrollHeight;
            if(window.updateChatRisk)window.updateChatRisk();
        }

        function handleSendMessage(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text || !activeChatRoomId) return;

            chats[activeChatRoomId].messages.push({
                sender: userAuth.name,
                text: text,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });

            saveChats();
            input.value = '';
            renderChatMessages();
            updateUnreadBadge();
        }

        function sendQuickMessage(text) {
            if (!activeChatRoomId) return;
            document.getElementById('chat-input').value = text;
            if(window.updateChatRisk)window.updateChatRisk();
        }

        // 내 대화 목록 모달
        function openChatListModal() {
            const container = document.getElementById('chat-room-container');
            const roomKeys = Object.keys(chats);

            if (roomKeys.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-xs text-gray-400">진행 중인 대화가 없습니다.</div>';
            } else {
                container.innerHTML = roomKeys.map(key => {
                    const room = chats[key];
                    const lastMsg = room.messages[room.messages.length - 1];

                    return `
                        <div onclick="openExistingChat(decodeURIComponent('${encodeURIComponent(room.id).replace(/'/g, '%27')}'))" class="p-3 hover:bg-sky-50 rounded-xl cursor-pointer transition flex items-center justify-between">
                            <div>
                                <div class="font-bold text-sm text-gray-800">${escapeHtml(room.partner)}</div>
                                <div class="text-xs text-gray-500 truncate max-w-[200px]">${escapeHtml(room.itemTitle)}</div>
                                <div class="text-xs text-sky-600 mt-1">${lastMsg ? lastMsg.text : ''}</div>
                            </div>
                            <span class="text-[10px] text-gray-400">${lastMsg ? lastMsg.time : ''}</span>
                        </div>
                    `;
                }).join('');
            }

            document.getElementById('chat-list-modal').classList.remove('hidden');
        }

        function closeChatListModal() {
            document.getElementById('chat-list-modal').classList.add('hidden');
        }

        function openExistingChat(roomId) {
            closeChatListModal();
            activeChatRoomId = roomId;
            document.getElementById('chat-input').value='';
            const room = chats[roomId];
            document.getElementById('chat-partner-name').innerText = room.partner;
            document.getElementById('chat-item-title').innerText = room.itemTitle;
            renderChatMessages();
            document.getElementById('chat-modal').classList.remove('hidden');
        }

        function updateUnreadBadge() {
            const badge = document.getElementById('unread-chat-badge');
            if (Object.keys(chats).length > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        // --- 상세페이지 모달 기능 ---
        function openDetailModal(id) {
            selectedItemId = id;
            const item = items.find(i => i.id === id);
            if (!item) return;

            document.getElementById('detail-badge').innerText = item.type === 'market' ? '🛍️ 중고거래' : '🔍 분실물';
            const photo=document.getElementById('detail-photo');
            const validPhoto=validProductPhoto(item.photo);
            photo.hidden=!validPhoto;
            document.getElementById('detail-photo-note').hidden=!SampleCatalog.isGeneratedPhoto(item);
            document.getElementById('detail-photo-placeholder').hidden=validPhoto;
            if(validPhoto)photo.src=item.photo;else photo.removeAttribute('src');
            document.getElementById('detail-title').innerText = item.title;
            document.getElementById('detail-price').innerText = item.price === 0 ? '무료나눔 🎁' : `${item.price.toLocaleString()}원`;
            document.getElementById('detail-zone').innerText = item.zone;
            document.getElementById('detail-author').innerText = item.author;
            document.getElementById('detail-category').innerText = item.category;
            document.getElementById('detail-desc').innerText = item.desc;
            // 버튼 이벤트 바인딩
            document.getElementById('detail-chat-btn').onclick = () => {
                closeDetailModal();
                openChatModal(item.id, item.author);
            };

            const agreementButton=document.getElementById('detail-agreement-btn');
            if(agreementButton){agreementButton.hidden=item.type!=='market';agreementButton.textContent=item.ownerId===userAuth?.id?'판매 조건 작성·수정':'거래 조건 확인';}
            const deleteButton=document.getElementById('detail-delete-btn');
            deleteButton.hidden=Boolean(item.ownerId) && userAuth?.id!==item.ownerId;
            deleteButton.textContent=item.ownerId?'상품 삭제':'예시 상품 삭제';
            deleteButton.onclick=()=>deletePost(item.id);

            document.getElementById('detail-modal').classList.remove('hidden');
        }

        function closeDetailModal() {
            document.getElementById('detail-modal').classList.add('hidden');
        }

        function openPostModal() { requestProductRegistration(); }

        // 상품 삭제: 새 상품은 소유 계정, 예전 예시는 삭제 비밀번호 확인.
        function deletePost(id) {
            userAuth=readDemo('sm_userAuth',null);
            const currentItems=readDemo('sm_items',[]);
            const item=currentItems.find(value=>value.id===id);
            if(!item){alert('이미 삭제된 상품입니다.');items=currentItems;closeDetailModal();renderItems();return;}
            if(item.ownerId){
                if(!userAuth || userAuth.id!==item.ownerId){alert('본인이 등록한 상품만 삭제할 수 있습니다.');return;}
            }else{
                const pwd=prompt('예시 상품의 삭제 비밀번호를 입력하세요 (기본 예시: 1234):');
                if(pwd===null)return;
                if(!item.password || item.password!==pwd){alert('비밀번호가 일치하지 않습니다.');return;}
            }
            if(!confirm('이 상품을 삭제하시겠습니까?'))return;
            const remaining=currentItems.filter(value=>value.id!==id);
            try{localStorage.setItem('sm_items',JSON.stringify(remaining));}
            catch{alert('삭제 내용을 저장하지 못했습니다. 다시 시도해 주세요.');return;}
            items=remaining;
            favorites=favorites.filter(value=>value!==id);
            try{saveFavorites();}catch{/* 상품 삭제는 저장되었으며 화면의 찜 목록도 정리합니다. */}
            selectedItemId=null;
            closeDetailModal();renderItems();
            alert('상품이 삭제되었습니다.');
        }


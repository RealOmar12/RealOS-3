const IconDrag = {
    active: false,
    dragEl: null,
    pressTimer: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    originalPos: null,
    placeholder: null,
    emptyIndicators: [],
    activeDisplacement: null,
    animatingIcons: new Map(),
    touchId: null,
    hasMoved: false,
    sourceEl: null,
    currentTarget: null,
    COLS: 4,
    ROWS: 8,
    resolveAnimations: () => {
        IconDrag.animatingIcons.forEach((timer, iconId) => {
            clearTimeout(timer);
            const el = document.getElementById('icon-' + iconId);
            if (el) {
                el.style.transition = '';
                el.style.transform = '';
            }
        });
        IconDrag.animatingIcons.clear();
    },
    animateIcon: (el, appId, fromRect) => {
        const toRect = el.getBoundingClientRect();
        const dx = fromRect.left - toRect.left;
        const dy = fromRect.top - toRect.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.offsetHeight;
        el.style.transition = 'transform 0.45s cubic-bezier(0.25,1,0.5,1)';
        el.style.transform = 'translate(0,0)';
        if (IconDrag.animatingIcons.has(appId)) {
            clearTimeout(IconDrag.animatingIcons.get(appId));
        }
        const timer = setTimeout(() => {
            el.style.transition = '';
            el.style.transform = '';
            IconDrag.animatingIcons.delete(appId);
        }, 460);
        IconDrag.animatingIcons.set(appId, timer);
    },
    init: () => {
        const grid = document.getElementById('app-grid');
        if (!grid) return;
        grid.addEventListener('mousedown', IconDrag.onStart);
        grid.addEventListener('touchstart', IconDrag.onStart, { passive: false });
        document.addEventListener('mousemove', IconDrag.onMove);
        document.addEventListener('touchmove', IconDrag.onMove, { passive: false });
        document.addEventListener('mouseup', IconDrag.onEnd);
        document.addEventListener('touchend', IconDrag.onEnd);
    },
    getPos: (e) => {
        if (e.touches && IconDrag.touchId !== null) {
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === IconDrag.touchId) {
                    return { x: e.touches[i].clientX, y: e.touches[i].clientY };
                }
            }
        }
        const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
        return { x: t.clientX, y: t.clientY };
    },
    getGridApps: () => {
        const apps = APPS.filter(a => a.area === 'grid' && !a.hidden);
        if (State.emptyApps) {
            State.emptyApps.forEach(ea => apps.push({ id: ea.id, name: ea.name, area: 'grid' }));
        }
        return apps;
    },
    getGridMetrics: () => {
        const grid = document.getElementById('app-grid');
        const gridRect = grid.getBoundingClientRect();
        const gridStyles = window.getComputedStyle(grid);
        const colGap = parseFloat(gridStyles.columnGap) || 15;
        const rowGap = parseFloat(gridStyles.rowGap) || 25;
        const totalScale = gridRect.width / grid.offsetWidth;
        const cellW = (grid.offsetWidth - colGap * (IconDrag.COLS - 1)) / IconDrag.COLS;
        const firstIcon = grid.querySelector('.app-icon:not(.app-clone)');
        let cellH = 86;
        if (firstIcon && firstIcon !== IconDrag.sourceEl) {
            cellH = firstIcon.getBoundingClientRect().height / totalScale;
        }
        return { gridRect, colGap, rowGap, totalScale, cellW, cellH };
    },
    cellFromClientPoint: (clientX, clientY) => {
        const grid = document.getElementById('app-grid');
        if (!grid) return null;
        const dock = document.getElementById('dock');
        if (dock) {
            const dockRect = dock.getBoundingClientRect();
            if (clientY >= dockRect.top) return null;
        }
        const m = IconDrag.getGridMetrics();
        let maxRows = IconDrag.ROWS;
        const dockEl = document.getElementById('dock');
        if (dockEl) {
            const dockTop = dockEl.getBoundingClientRect().top;
            const availableH = (dockTop - m.gridRect.top) / m.totalScale;
            const rowStride = m.cellH + m.rowGap;
            maxRows = Math.min(IconDrag.ROWS, Math.floor(availableH / rowStride));
        }
        const relX = (clientX - m.gridRect.left) / m.totalScale;
        const relY = (clientY - m.gridRect.top) / m.totalScale;
        if (relX < 0 || relY < 0) return null;
        const colStride = m.cellW + m.colGap;
        const rowStride = m.cellH + m.rowGap;
        const col = Math.floor(relX / colStride);
        const row = Math.floor(relY / rowStride);
        if (col < 0 || col >= IconDrag.COLS || row < 0 || row >= maxRows) return null;
        const inCellX = relX - col * colStride;
        const inCellY = relY - row * rowStride;
        if (inCellX > m.cellW + m.colGap * 0.5 || inCellY > m.cellH + m.rowGap * 0.5) return null;
        return { row, col };
    },
    getOccupied: (excludeId) => {
        const occupied = {};
        const gridApps = IconDrag.getGridApps();
        gridApps.forEach((app, idx) => {
            if (app.id === excludeId) return;
            let pos;
            if (State.iconPositions && State.iconPositions[app.id]) {
                pos = State.iconPositions[app.id];
            } else {
                pos = { row: Math.floor(idx / 4), col: idx % 4 };
            }
            occupied[`${pos.row},${pos.col}`] = app.id;
        });
        return occupied;
    },
    getCellRect: (row, col) => {
        const grid = document.getElementById('app-grid');
        const gridRect = grid.getBoundingClientRect();
        const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);
        const homeRect = document.getElementById('home-contents').getBoundingClientRect();
        const screenRect = document.getElementById('screen').getBoundingClientRect();
        const zoomScale = (homeRect.width / screenRect.width) || 0.92;
        const totalScale = scaleFactor * zoomScale;
        const gridStyles = window.getComputedStyle(grid);
        const colGap = parseFloat(gridStyles.columnGap) || 15;
        const rowGap = parseFloat(gridStyles.rowGap) || 25;
        const gridW = gridRect.width / totalScale;
        const cellW = (gridW - colGap * (IconDrag.COLS - 1)) / IconDrag.COLS;
        const cellH = 86;
        return {
            x: col * (cellW + colGap),
            y: row * (cellH + rowGap),
            w: cellW,
            h: cellH
        };
    },
    onStart: (e) => {
        if (IconDrag.active || IconDrag.dragEl) return;
        if (e.touches && e.touches.length > 1) return;
        const icon = e.target.closest('.app-icon');
        if (!icon || icon.closest('.dock')) return;
        if (State.activeApp || State.isAnimating) return;
        if (e.touches && e.touches[0]) {
            IconDrag.touchId = e.touches[0].identifier;
        } else {
            IconDrag.touchId = null;
        }
        IconDrag.activeDisplacement = null;
        const pos = IconDrag.getPos(e);
        IconDrag.startX = pos.x;
        IconDrag.startY = pos.y;
        IconDrag.pressTimer = setTimeout(() => {
            IconDrag.activate(icon, pos);
        }, 500);
    },
    activate: (icon, pos) => {
        IconDrag.active = true;
        const appId = icon.id.replace('icon-', '');

        const screen = document.getElementById('screen');
        const rect = icon.getBoundingClientRect();
        const screenRect = screen.getBoundingClientRect();
        const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);

        const clone = icon.cloneNode(true);
        clone.id = icon.id + '-clone';
        clone.classList.add('dragging');
        clone.classList.add('app-clone');
        clone.style.position = 'absolute';
        clone.style.margin = '0';
        clone.style.zIndex = '9999';

        const localX = (rect.left - screenRect.left) / scaleFactor;
        const localY = (rect.top - screenRect.top) / scaleFactor;

        clone.style.left = localX + 'px';
        clone.style.top = localY + 'px';
        clone.style.width = (rect.width / scaleFactor) + 'px';
        clone.style.height = (rect.height / scaleFactor) + 'px';

        screen.appendChild(clone);

        IconDrag.dragEl = clone;
        IconDrag.sourceEl = icon;
        icon.style.opacity = '0';

        const gridApps = IconDrag.getGridApps();
        const idx = gridApps.findIndex(a => a.id === appId);
        if (State.iconPositions && State.iconPositions[appId]) {
            IconDrag.originalPos = { ...State.iconPositions[appId] };
        } else {
            IconDrag.originalPos = { row: Math.floor(idx / 4), col: idx % 4 };
        }
        document.body.classList.add('drag-mode');

        IconDrag.offsetX = pos.x - rect.left;
        IconDrag.offsetY = pos.y - rect.top;
        IconDrag.hasMoved = false;
        IconDrag.currentTarget = null;

        const ph = document.createElement('div');
        ph.className = 'grid-placeholder';
        ph.style.gridRow = IconDrag.originalPos.row + 1;
        ph.style.gridColumn = IconDrag.originalPos.col + 1;
        document.getElementById('app-grid').appendChild(ph);
        IconDrag.placeholder = ph;

        IconDrag.emptyIndicators = [];
        const occupied = IconDrag.getOccupied(appId);
        const m = IconDrag.getGridMetrics();
        const dockEl = document.getElementById('dock');
        let maxRows = IconDrag.ROWS;
        if (dockEl) {
            const dockTop = dockEl.getBoundingClientRect().top;
            const availableH = (dockTop - m.gridRect.top) / m.totalScale;
            const rowStride = m.cellH + m.rowGap;
            maxRows = Math.min(IconDrag.ROWS, Math.floor(availableH / rowStride));
        }
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < IconDrag.COLS; c++) {
                if (!occupied[`${r},${c}`] && !(r === IconDrag.originalPos.row && c === IconDrag.originalPos.col)) {
                    const ind = document.createElement('div');
                    ind.className = 'grid-empty-indicator';
                    ind.style.gridRow = r + 1;
                    ind.style.gridColumn = c + 1;
                    document.getElementById('app-grid').appendChild(ind);
                    IconDrag.emptyIndicators.push(ind);
                }
            }
        }

        if (appId.startsWith('empty_')) {
            let trashBtn = document.getElementById('home-trash-btn');
            if (!trashBtn) {
                trashBtn = document.createElement('div');
                trashBtn.id = 'home-trash-btn';
                trashBtn.innerHTML = '<i class="fas fa-trash"></i>';
                const contents = document.getElementById('home-contents');
                if (contents && contents.parentElement) {
                    contents.parentElement.appendChild(trashBtn);
                }
            }
            if (trashBtn) {
                trashBtn.style.opacity = '1';
                trashBtn.style.pointerEvents = 'auto';
            }
        }

        if (navigator.vibrate) navigator.vibrate(30);
    },
    onMove: (e) => {
        if (e.touches && IconDrag.touchId !== null) {
            let found = false;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === IconDrag.touchId) { found = true; break; }
            }
            if (!found) return;
        }
        if (Math.abs(IconDrag.getPos(e).x - IconDrag.startX) > 10 || Math.abs(IconDrag.getPos(e).y - IconDrag.startY) > 10) {
            if (IconDrag.pressTimer && !IconDrag.active) {
                clearTimeout(IconDrag.pressTimer);
                IconDrag.pressTimer = null;
            }
        }
        if (!IconDrag.active || !IconDrag.dragEl) return;
        e.preventDefault();
        IconDrag.hasMoved = true;
        const pos = IconDrag.getPos(e);
        const screenRect = document.getElementById('screen').getBoundingClientRect();

        const trashBtn = document.getElementById('home-trash-btn');
        if (trashBtn && trashBtn.style.opacity === '1') {
            const tr = trashBtn.getBoundingClientRect();
            const trashCx = tr.left + tr.width / 2;
            const trashCy = tr.top + tr.height / 2;
            const dist = Math.hypot(pos.x - trashCx, pos.y - trashCy);
            if (dist < 60) {
                trashBtn.classList.add('active-drop');
            } else {
                trashBtn.classList.remove('active-drop');
            }
        }

        const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);

        const localX = (pos.x - IconDrag.offsetX - screenRect.left) / scaleFactor;
        const localY = (pos.y - IconDrag.offsetY - screenRect.top) / scaleFactor;
        IconDrag.dragEl.style.left = localX + 'px';
        IconDrag.dragEl.style.top = localY + 'px';

        const dragRect = IconDrag.dragEl.getBoundingClientRect();
        const centerX = dragRect.left + dragRect.width / 2;
        const centerY = dragRect.top + dragRect.height / 2;

        const cell = IconDrag.cellFromClientPoint(centerX, centerY);

        const cellChanged = !cell || !IconDrag.currentTarget ? !!IconDrag.currentTarget :
            (cell.row !== IconDrag.currentTarget.row || cell.col !== IconDrag.currentTarget.col);

        if (cellChanged && IconDrag.activeDisplacement && IconDrag.currentTarget) {
            const d = IconDrag.activeDisplacement;
            const displacedEl = document.getElementById('icon-' + d.appId);
            if (displacedEl) {
                IconDrag.resolveAnimations();
                const fromRect = displacedEl.getBoundingClientRect();
                displacedEl.style.gridRow = d.originalPos.row + 1;
                displacedEl.style.gridColumn = d.originalPos.col + 1;
                IconDrag.animateIcon(displacedEl, d.appId, fromRect);
                if (!State.iconPositions) State.iconPositions = {};
                State.iconPositions[d.appId] = { row: d.originalPos.row, col: d.originalPos.col };

                const ind = document.createElement('div');
                ind.className = 'grid-empty-indicator';
                ind.style.gridRow = d.newPos.row + 1;
                ind.style.gridColumn = d.newPos.col + 1;
                document.getElementById('app-grid').appendChild(ind);
                IconDrag.emptyIndicators.push(ind);
            }
            IconDrag.activeDisplacement = null;
        }

        if (!cell) {
            if (IconDrag.placeholder) IconDrag.placeholder.classList.remove('visible');
            IconDrag.currentTarget = null;
            return;
        }

        if (cell.row === IconDrag.originalPos.row && cell.col === IconDrag.originalPos.col) {
            if (IconDrag.placeholder) IconDrag.placeholder.classList.remove('visible');
            IconDrag.currentTarget = null;
            return;
        }

        if (IconDrag.currentTarget && cell.row === IconDrag.currentTarget.row && cell.col === IconDrag.currentTarget.col) return;

        const appId = IconDrag.sourceEl.id.replace('icon-', '');
        const occupied = IconDrag.getOccupied(appId);
        const occupantId = occupied[`${cell.row},${cell.col}`];

        if (occupantId) {
            const occupantEl = document.getElementById('icon-' + occupantId);
            if (occupantEl) {
                const m = IconDrag.getGridMetrics();
                const dockEl = document.getElementById('dock');
                let maxRows = IconDrag.ROWS;
                if (dockEl) {
                    const dockTop = dockEl.getBoundingClientRect().top;
                    const availableH = (dockTop - m.gridRect.top) / m.totalScale;
                    const rowStride = m.cellH + m.rowGap;
                    maxRows = Math.min(IconDrag.ROWS, Math.floor(availableH / rowStride));
                }

                const occupantRow = parseInt(occupantEl.style.gridRow) - 1;
                const occupantCol = parseInt(occupantEl.style.gridColumn) - 1;
                let bestRow = -1, bestCol = -1, bestDist = Infinity;
                for (let r = 0; r < maxRows; r++) {
                    for (let c = 0; c < IconDrag.COLS; c++) {
                        if (r === cell.row && c === cell.col) continue;
                        const isOccupied = occupied[`${r},${c}`];
                        const isDragOrigin = r === IconDrag.originalPos.row && c === IconDrag.originalPos.col;
                        if (!isOccupied || isDragOrigin) {
                            const dist = Math.abs(r - occupantRow) + Math.abs(c - occupantCol);
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestRow = r;
                                bestCol = c;
                            }
                        }
                    }
                }
                if (bestRow === -1) {
                    bestRow = IconDrag.originalPos.row;
                    bestCol = IconDrag.originalPos.col;
                }
                const nextRow = bestRow;
                const nextCol = bestCol;

                const originalPos = {
                    row: occupantRow,
                    col: occupantCol
                };

                IconDrag.resolveAnimations();
                const fromRect = occupantEl.getBoundingClientRect();
                occupantEl.style.gridRow = nextRow + 1;
                occupantEl.style.gridColumn = nextCol + 1;
                IconDrag.animateIcon(occupantEl, occupantId, fromRect);

                if (!State.iconPositions) State.iconPositions = {};
                State.iconPositions[occupantId] = { row: nextRow, col: nextCol };

                IconDrag.activeDisplacement = {
                    appId: occupantId,
                    originalPos: originalPos,
                    newPos: { row: nextRow, col: nextCol },
                    triggerCell: { row: cell.row, col: cell.col }
                };

                const indToRemove = IconDrag.emptyIndicators.find(ind => parseInt(ind.style.gridRow) === nextRow + 1 && parseInt(ind.style.gridColumn) === nextCol + 1);
                if (indToRemove) {
                    indToRemove.remove();
                    IconDrag.emptyIndicators = IconDrag.emptyIndicators.filter(i => i !== indToRemove);
                }
            }
        }

        IconDrag.currentTarget = { row: cell.row, col: cell.col };

        if (IconDrag.placeholder) {
            IconDrag.placeholder.style.gridRow = cell.row + 1;
            IconDrag.placeholder.style.gridColumn = cell.col + 1;
            IconDrag.placeholder.classList.add('visible');
        }
    },
    onEnd: (e) => {
        if (e.changedTouches && IconDrag.touchId !== null) {
            let found = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === IconDrag.touchId) { found = true; break; }
            }
            if (!found) return;
        }
        if (IconDrag.pressTimer) {
            clearTimeout(IconDrag.pressTimer);
            IconDrag.pressTimer = null;
        }
        IconDrag.activeDisplacement = null;
        if (!IconDrag.active || !IconDrag.dragEl) {
            IconDrag.touchId = null;
            return;
        }
        IconDrag.active = false;
        IconDrag.touchId = null;
        const clone = IconDrag.dragEl;
        const source = IconDrag.sourceEl;
        const appId = source.id.replace('icon-', '');

        let trashed = false;
        if (appId.startsWith('empty_')) {
            const trashBtn = document.getElementById('home-trash-btn');
            if (trashBtn && trashBtn.classList.contains('active-drop')) {
                trashed = true;
                State.emptyApps = State.emptyApps.filter(ea => ea.id !== appId);
                Storage.saveSettings();
                OS.renderApps();
                setTimeout(() => OS.enterEditMode(), 100);
            }
            if (trashBtn) {
                trashBtn.style.opacity = '0';
                trashBtn.style.pointerEvents = 'none';
                trashBtn.classList.remove('active-drop');
            }
        }

        if (trashed) {
            if (IconDrag.placeholder) IconDrag.placeholder.remove();
            IconDrag.emptyIndicators.forEach(ind => ind.remove());
            IconDrag.emptyIndicators = [];
            if (clone) clone.remove();
            document.body.classList.remove('drag-mode');
            IconDrag.dragEl = null;

            IconDrag.sourceEl = null;
            IconDrag.originalPos = null;
            IconDrag.placeholder = null;
            IconDrag.currentTarget = null;
            return;
        }

        let targetRow, targetCol;
        if (!IconDrag.hasMoved || !IconDrag.currentTarget) {
            targetRow = IconDrag.originalPos.row;
            targetCol = IconDrag.originalPos.col;
        } else {
            targetRow = IconDrag.currentTarget.row;
            targetCol = IconDrag.currentTarget.col;
        }

        if (!State.iconPositions) State.iconPositions = {};
        State.iconPositions[appId] = { row: targetRow, col: targetCol };

        if (IconDrag.placeholder) {
            IconDrag.placeholder.remove();
            IconDrag.placeholder = null;
        }
        IconDrag.emptyIndicators.forEach(ind => ind.remove());
        IconDrag.emptyIndicators = [];
        IconDrag.activeDisplacement = null;

        document.body.classList.remove('drag-mode');
        IconDrag.lastDropTime = Date.now();

        source.style.gridRow = targetRow + 1;
        source.style.gridColumn = targetCol + 1;
        source.style.opacity = '';
        if (clone && clone.parentNode) clone.remove();

        IconDrag.dragEl = null;
        IconDrag.sourceEl = null;
        IconDrag.originalPos = null;
        IconDrag.currentTarget = null;
        Storage.saveSettings();
    }
};

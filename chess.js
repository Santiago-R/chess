document.addEventListener("DOMContentLoaded", function () {

    // THEME COLORS
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq.matches) document.body.style.background = "black";
    else document.body.style.background = "white";

    var board_dark = '#b88c5a';
    var board_light = '#f3e2c6';
    // var board_dark = '#707766';
    // var board_light = '#CCCCBB';

    // PIECE SETS
    // Choose piece set from the list at https://github.com/pychess/pychess/tree/master/pieces:
    const piece_sets =
        'alfonso, alpha, california, cardinal, cburnett, celtic, chess7, chessicons, chessmonk, chessnut, companion, dubrovny, \
        eyes, fantasy, fantasy_alt, freak, freestaunton, fresca, gioco, governor, horsey, icpieces, kilfiger, kosal, leipzig, \
        letter, libra, maestro, magnetic, makruk, maya, merida, merida_new, metaltops, pirat, pirouetti, pixel, prmi, \
        regular, reillycraig, riohacha, shapes, sittuyin, skulls, spatial, staunty, tatiana, ttf'.split(', ');
    var piece_set = 'merida_new';
    // var piece_set = piece_sets[Math.floor(Math.random() * piece_sets.length)];

    var piece_source = 'https://raw.githubusercontent.com/pychess/pychess/f417c22b31f8d79975ce9962d93910797cf827ca/pieces/';

    var pieces = ['b', 'k', 'n', 'p', 'q', 'r', 'B', 'K', 'N', 'P', 'Q', 'R'];
    var pieces_alt = ['bb', 'bk', 'bn', 'bp', 'bq', 'br', 'wb', 'wk', 'wn', 'wp', 'wq', 'wr'];
    var pieces_verbose = [
        'black bishop', 'black king', 'black knight', 'black pawn', 'black queen', 'black rook',
        'white bishop', 'white king', 'white knight', 'white pawn', 'white queen', 'white rook'
    ];

    const svg_images = [];
    for (let p of pieces_alt) svg_images.push(piece_source + piece_set + '/' + p + '.svg');

    // RESPONSIVE BOARD
    var board = document.createElement('div');
    board.draggable = false;
    function resizeBoard() {
        var height = window.innerHeight;
        var width = window.innerWidth;
        board.style.width = board.style.height = Math.min(height, width) + 'px';
        board.style.left = (width - Math.min(height, width)) / 2 + 'px';
        board.style.top = (height - Math.min(height, width)) / 2 + 'px';
        board.style.border = '1px solid #000000';
        board.style.position = 'absolute';
    }
    window.addEventListener('resize', resizeBoard);
    resizeBoard(board);
    document.body.appendChild(board);

    // HELPER FUNCTIONS
    const let_num = { 'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5', 'f': '6', 'g': '7', 'h': '8' };
    const num_let = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f', '7': 'g', '8': 'h' };
    const i_nn = (i) => (Math.floor(i / 8) + 1) + '' + (i % 8 + 1);
    const nn_i = (nn) => 8 * (parseInt((nn + '').charAt(0)) - 1) + parseInt((nn + '').charAt(1)) - 1;
    const sn_nn = (sn) => sn.replace(/[a-h]/g, ch => let_num[ch]);
    const nn_sn = (nn) => nn.charAt(0).replace(/[1-8]/g, ch => num_let[ch]) + nn.charAt(1);
    const squ = (sn) => squares[nn_i(sn_nn(sn))];
    const color = (piece) => pieces_verbose[pieces.indexOf(piece.id)].slice(0, 5);

    // SQUARES
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let square = document.createElement('div');
            square.className = 'square';
            square.id = (i + 1) + '' + (j + 1);
            square.legal = false;
            square.draggable = false;
            square.style.width = square.style.height = '12.5%';
            square.style.backgroundColor = (i + j) % 2 == 0 ? board_dark : board_light;
            square.style.position = 'absolute';
            square.style.left = i * 12.5 + '%';
            square.style.top = (7 - j) * 12.5 + '%';
            square.style.border = '1px solid transparent';
            square.isEmpty = () => square.children.length == 0 || square.children[0].className == 'legal';
            board.appendChild(square);
            square.addEventListener('click', clickOnSquare);
            square.ondragenter = dragEnterSquare;
        }
    }
    squares = board.children;

    // PIECES
    function putPiece(piece, square_name) {
        let square = squ(square_name);
        let img = document.createElement('img');
        img.src = svg_images[pieces.indexOf(piece)];
        img.id = piece;
        img.className = 'piece';
        img.draggable = true;
        img.style.width = img.style.height = '90%';
        img.style.position = 'absolute';
        img.style.left = img.style.top = '5%';
        square.appendChild(img);
        img.addEventListener('click', clickOnPiece);
        img.onmouseenter = e => img.style.cursor = 'grab';
    }

    // INITIAL SETUP
    const initial_positions = {
        'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R',  // White back row
        'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',  // White pawns
        'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r',  // Black back row
        'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p'   // Black pawns
    }
    Object.entries(initial_positions).forEach(([sq, p]) => putPiece(p, sq));
    var piece_list = Array.from(board.getElementsByClassName('piece'));
    piece_list.filter((p) => p.id == 'K' || p.id == 'k').forEach((p) => p.canCastle = true);
    piece_list.filter((p) => p.id == 'R' || p.id == 'r').forEach((p) => p.canCastle = true);
    piece_list.filter((p) => p.id == 'P' || p.id == 'p').forEach((p) => p.movex2 = false);
    var history = [];

    // GAMEPLAY
    var whiteTurn = true, selected = null, target_sq = null, king_in_check = null, checked_square = null;
    turnColor = () => whiteTurn ? 'white' : 'black';
    var legal_squares = [];
    newLegalCircle = () => {
        var c = document.createElement('img');
        c.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="green" opacity="0.3"/>
                    </svg>
                `);
        c.className = 'legal';
        c.style.position = 'absolute';
        c.style.width = c.style.height = '40%';
        c.style.left = c.style.top = '30%';
        c.style.pointerEvents = 'none';
        return c;
    }

    function applyLaw(im) {
        // Remove old legal squares
        for (let square of legal_squares) {
            square.legal = false;
            for (let child of square.children) {
                if (child.className == 'legal') child.remove();
            }
        }
        legal_squares = [];
        if (im == null) return;
        // Legal squares
        for (let square of squares) {
            if (isLegalMove(im, im.parentElement, square)) legal_squares.push(square);
        }
        for (square of legal_squares) {
            square.legal = true;
            square.appendChild(newLegalCircle());
        }
    }

    function isLegalMove(piece, fromSquare, toSquare) {
        if (!isPseudoLegalMove(piece, fromSquare, toSquare)) return false;

        // Temporarily make the move
        let eaten = toSquare.children[0];
        fromSquare.children[0].remove();
        if (eaten) eaten.remove();
        toSquare.appendChild(piece);

        let king = piece_list.filter(p => p.id.toLowerCase() == 'k' && color(p) == turnColor())[0];
        let inCheck = isSquareAttacked(king.parentElement, (turnColor() == 'white' ? 'black' : 'white'));

        // Undo the move
        toSquare.children[0].remove();
        fromSquare.appendChild(piece);
        if (eaten) toSquare.appendChild(eaten);

        return !inCheck;
    }

    function isSquareAttacked(square, byColor) {
        let enemy_pieces = piece_list.filter(p => color(p) == byColor && p.parentElement != null);
        for (let p of enemy_pieces) {
            if (isPseudoLegalMove(p, p.parentElement, square)) return true;
        }
        return false;
    }

    function isPseudoLegalMove(piece, fromSquare, toSquare) {
        if (!toSquare.isEmpty() && color(toSquare.children[0]) == color(piece)) return false; // Can't eat your own pieces
        let fromSQ = [fromSquare.id.charAt(0), fromSquare.id.charAt(1)];
        let toSQ = [toSquare.id.charAt(0), toSquare.id.charAt(1)];
        let x = parseInt(toSQ[0]) - parseInt(fromSQ[0]);
        let y = parseInt(toSQ[1]) - parseInt(fromSQ[1]);
        switch (piece.id.toLowerCase()) {
            case 'k':
                if (Math.abs(x) <= 1 && Math.abs(y) <= 1) return true;
                if (Math.abs(x) == 2 && y == 0 && piece.canCastle && king_in_check == null) {
                    let rook = squares[nn_i((x == 2 ? '8' : '1') + fromSQ[1])].children[0];
                    let isRook = rook != null && (rook.id.toLowerCase() == 'r');
                    if (isRook && rook.canCastle && pathEmpty(fromSQ, (x == 2 ? 3 : -4), y)) {
                        // Check if squares the king moves through are attacked
                        let inBetweenSquare = squares[nn_i((parseInt(fromSQ[0]) + (x > 0 ? 1 : -1)) + '' + fromSQ[1])];
                        if (isSquareAttacked(fromSquare, (turnColor() == 'white' ? 'black' : 'white'))) return false;
                        if (isSquareAttacked(inBetweenSquare, (turnColor() == 'white' ? 'black' : 'white'))) return false;
                        if (isSquareAttacked(toSquare, (turnColor() == 'white' ? 'black' : 'white'))) return false;
                        return true;
                    }
                }
                return false;
            case 'n': return Math.abs(x) + Math.abs(y) == 3 && x * y != 0;
            case 'p': return isLegalPawnMove(piece, x, y, fromSQ, toSQ, toSquare);
            case 'b': return (x == y || x == -y) && pathEmpty(fromSQ, x, y);
            case 'q': return (x == y || x == -y || x == 0 || y == 0) && pathEmpty(fromSQ, x, y);
            case 'r': return (x == 0 || y == 0) && pathEmpty(fromSQ, x, y);
        }
    }

    function isLegalPawnMove(piece, x, y, fromSQ, toSQ, toSquare) {
        if (piece.id == 'p') {
            if (((x == 1 && y == -1) || (x == -1 && y == -1))) {
                if (!toSquare.isEmpty()) return true; // Eat standard
                if (fromSQ[1] == 4) { // Eat en passant
                    let sqPassant = squares[nn_i(toSQ[0] + '' + fromSQ[1])];
                    if (sqPassant.isEmpty()) return false;
                    if (sqPassant.children[0].id == 'P' && sqPassant.children[0].movex2) return true;
                }
            }
            if ((x == 0 && y == -1) && toSquare.isEmpty()) return true; // Move Forward 1
            if (fromSQ[1] == 7 && y == -2 && x == 0 && pathEmpty(fromSQ, x, y - 1)) return true; // Move forward 2
            return false;
        } else {
            if (((x == 1 && y == 1) || (x == -1 && y == 1))) {
                if (!toSquare.isEmpty()) return true; // Eat standard
                if (fromSQ[1] == 5) { // Eat en passant
                    let sqPassant = squares[nn_i(toSQ[0] + '' + fromSQ[1])];
                    if (sqPassant.isEmpty()) return false;
                    if (sqPassant.children[0].id == 'p' && sqPassant.children[0].movex2) return true;
                }
            }
            if ((x == 0 && y == 1) && toSquare.isEmpty()) return true; // Move Forward 1
            if (fromSQ[1] == 2 && y == 2 && x == 0 && pathEmpty(fromSQ, x, y + 1)) return true; // Move forward 2
            return false;
        }
    }

    function pathEmpty(fromSQ, x, y) {
        let items = Math.max(Math.abs(x), Math.abs(y));
        incX = x / items || 0;
        incY = y / items || 0;
        for (let i = 1; i < parseInt(items); i++) {
            let sq = squares[nn_i((parseInt(fromSQ[0]) + (incX * i)) + '' + (parseInt(fromSQ[1]) + (incY * i)))];
            if (!sq.isEmpty()) {
                return false
            }
        }
        return true;
    }

    function move(piece, square) {
        history.push({ piece: piece.id, from: piece.parentElement.id, to: square.id });
        // Remove movex2 if pawn moved 2 turns ago
        if (history.length > 2) {
            if (history[history.length - 3].piece == 'p' || history[history.length - 3].piece == 'P') {
                let old_pawn = squares[nn_i(history[history.length - 3].to)].children[0];
                if (old_pawn) old_pawn.movex2 = false;
            }
        }
        // console.log(history[history.length - 1]);

        if (piece.id.toLowerCase() == 'k' || piece.id.toLowerCase() == 'r') {
            piece.canCastle = false;
            if (piece.id.toLowerCase() == 'k') {
                let row = square.id.charAt(1);
                if (square.id.charAt(0) - piece.parentElement.id.charAt(0) == 2) { // Short castle
                    square.appendChild(piece);
                    let row = (piece.id == 'K' ? 1 : 8);
                    squares[nn_i('6' + row)].appendChild(squares[nn_i('8' + row)].children[0]);
                    finalizeMove();
                    return;
                }
                if (square.id.charAt(0) - piece.parentElement.id.charAt(0) == -2) { // Long castle
                    square.appendChild(piece);
                    squares[nn_i('4' + row)].appendChild(squares[nn_i('1' + row)].children[0]);
                    finalizeMove();
                    return;
                }
            }
        }
        else if (piece.id.toLowerCase() == 'p') {
            if (Math.abs(square.id.charAt(1) - piece.parentElement.id.charAt(1)) == 2) { // Double move
                piece.movex2 = true;
            } else {
                piece.movex2 = false;
                if (square.id.charAt(0) != piece.parentElement.id.charAt(0) && square.isEmpty()) { // En passant
                    squares[nn_i(square.id.charAt(0) + '' + piece.parentElement.id.charAt(1))].children[0].remove();
                    square.appendChild(piece);
                    finalizeMove();
                    return;
                }
                if (square.id.charAt(1) == 8 || square.id.charAt(1) == 1) { // Promotion
                    let eaten = square.children[0];
                    if (eaten != null) eaten.remove();
                    piece.remove();
                    showPromotionChoice(piece, square);
                    return;
                }
            }
        }
        // Eat if there is another piece
        let eaten = square.children[0];
        if (eaten != null) eaten.remove();
        square.appendChild(piece);
        finalizeMove();
    }

    function showPromotionChoice(pawn, square) {
        // Remove any existing modal
        let oldModal = document.getElementById('promotion-modal');
        if (oldModal) oldModal.remove();
        // Create modal
        let modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.style.position = 'fixed';
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#eee';
        modal.style.border = '2px solid #333';
        modal.style.padding = '20px';
        modal.style.zIndex = 1000;
        modal.style.display = 'flex';
        modal.style.gap = '10px';
        let colorPrefix = pawn.id == 'P' ? 'w' : 'b';
        let options = [
            { id: colorPrefix + 'q', label: 'Queen', piece: pawn.id == 'P' ? 'Q' : 'q' },
            { id: colorPrefix + 'r', label: 'Rook', piece: pawn.id == 'P' ? 'R' : 'r' },
            { id: colorPrefix + 'b', label: 'Bishop', piece: pawn.id == 'P' ? 'B' : 'b' },
            { id: colorPrefix + 'n', label: 'Knight', piece: pawn.id == 'P' ? 'N' : 'n' }
        ];
        options.forEach(opt => {
            let btn = document.createElement('button');
            btn.style.background = 'none';
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.title = opt.label;
            let img = document.createElement('img');
            img.src = svg_images[pieces.indexOf(opt.piece)];
            img.style.width = img.style.height = '48px';
            btn.appendChild(img);
            btn.onclick = () => {
                modal.remove();
                putPiece(opt.piece, nn_sn(square.id));
                finalizeMove();
            };
            modal.appendChild(btn);
        });
        document.body.appendChild(modal);
    }

    function finalizeMove() {
        deselect();
        whiteTurn = !whiteTurn;
        piece_list = Array.from(board.getElementsByClassName('piece'));

        // Reset king_in_check background
        if (checked_square) {
            let i = parseInt(checked_square.id.charAt(0)) - 1;
            let j = parseInt(checked_square.id.charAt(1)) - 1;
            checked_square.style.backgroundColor = (i + j) % 2 == 0 ? board_dark : board_light;
            checked_square = null;
        }

        // Check for check
        let king = piece_list.filter(p => p.id.toLowerCase() == 'k' && color(p) == turnColor())[0];
        if (isSquareAttacked(king.parentElement, (turnColor() == 'white' ? 'black' : 'white'))) {
            king_in_check = king;
            checked_square = king.parentElement;
            checked_square.style.backgroundColor = '#F18171';  // red
        } else {
            king_in_check = null;
        }

        // Insufficient material check
        if (isInsufficientMaterial()) {
            setTimeout(() => {
                alert('Draw! Insufficient material.');
            }, 10);
            return;
        }

        if (!hasLegalMoves(turnColor())) {
            setTimeout(() => {
                if (king_in_check) {
                    alert('Checkmate! ' + (turnColor() == 'white' ? 'Black' : 'White') + ' wins.');
                } else {
                    alert('Stalemate! The game is a draw.');
                }
            }, 10);
        }
    }

    function isInsufficientMaterial() {
        // Get all remaining pieces
        let piecesOnBoard = Array.from(board.getElementsByClassName('piece'));
        let pieceIds = piecesOnBoard.map(p => p.id.toLowerCase()).sort();
        // Only kings
        if (pieceIds.length === 2 && pieceIds.includes('k')) return true;
        // King and bishop or king and knight vs king
        if (pieceIds.length === 3 && pieceIds.filter(t => t === 'b' || t === 'n').length === 1) return true;
        // King and bishop vs king and bishop (same color bishops)
        if (pieceIds.length === 4 && pieceIds.filter(t => t === 'b').length === 2) {
            // Check bishop colors
            let bishops = piecesOnBoard.filter(p => p.id.toLowerCase() === 'b');
            if (bishops.length === 2) {
                let sqColors = bishops.map(b => {
                    let sq = b.parentElement;
                    let i = parseInt(sq.id.charAt(0)) - 1;
                    let j = parseInt(sq.id.charAt(1)) - 1;
                    return (i + j) % 2;
                });
                if (sqColors[0] === sqColors[1]) return true;
            }
        }
        return false;
    }

    function hasLegalMoves(playerColor) {
        let playerPieces = piece_list.filter(p => color(p) == playerColor && p.parentElement != null);
        for (let piece of playerPieces) {
            for (let square of squares) {
                if (isLegalMove(piece, piece.parentElement, square)) {
                    return true;
                }
            }
        }
        return false;
    }

    function select(im) {
        selected = im;
        im.style.width = im.style.height = '100%';
        im.style.left = im.style.top = '0%';
        applyLaw(im);
    }
    function deselect() {
        if (selected == null) return;
        selected.style.width = selected.style.height = '90%';
        selected.style.left = selected.style.top = '5%';
        selected = null;
        applyLaw(null);
    }

    // EVENT HANDLERS
    function clickOnSquare() {
        if (selected != null && selected != this.children[0] && legal_squares.indexOf(this) != -1) {
            move(selected, this);
        };
    }
    function dragEnterSquare() { target_sq = this; }

    function clickOnPiece() {
        if (selected == null && color(this) == turnColor()) {
            select(this);
        } else if (this === selected) {
            deselect();
        } else if (selected != null && legal_squares.indexOf(this.parentElement) != -1) {
            move(selected, this.parentElement);
        } else if (selected != null && color(this) == turnColor()) {
            deselect();
            select(this);
        } else {
            deselect();
        }
    }

    board.ondragstart = (e) => {
        // e.overrideDefault();  // If uncommented, need to re-program a lot of useful behavior
        if (pieces.indexOf(e.target.id) == -1) return;
        let img = e.target;
        img.style.opacity = '0';
        board.style.cursor = 'grabbing';  // Doesn't work! (default is 'not-allowed')
        if (color(img) == turnColor()) {
            deselect();
            select(img);
        } else {
            deselect();
        }
    };

    board.ondragend = (e) => {
        if (pieces.indexOf(e.target.id) == -1) return; // Exit if not a piece
        let img = e.target;
        if (target_sq != null) {
            if (legal_squares.indexOf(target_sq) != -1 && img.parentElement != target_sq) {
                move(img, target_sq);
            }
        }
        deselect();
        img.style.opacity = '1';
        board.style.cursor = 'auto';
    };

});
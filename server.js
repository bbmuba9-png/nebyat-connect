const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// ተጠቃሚዎች ስልክ ቁጥራቸውን እና የሶኬት መለያቸውን (Socket ID) ለመያዝ
const users = {}; 

io.on('connection', (socket) => {
    console.log('ተጠቃሚ ተገናኝቷል (Connected):', socket.id);

    // 1. ተጠቃሚው ስልክ ቁጥሩን ሲመዘግብ
    socket.on('register-phone', (phoneNumber) => {
        users[phoneNumber] = socket.id;
        console.log(`ስልክ ቁጥር ተመዝግቧል: ${phoneNumber} -> ሶኬት ID: ${socket.id}`);
    });

    // 2. ቀጥተኛ ጥሪ ማድረግ (Direct Call Signaling)
    socket.on('call-user', ({ targetPhoneNumber, callerPhoneNumber }) => {
        const targetSocketId = users[targetPhoneNumber];

        if (targetSocketId) {
            // ጥሪውን ወደ ተቀባዩ ስልክ መላክ (Ringing Event)
            io.to(targetSocketId).emit('incoming-call', {
                callerPhoneNumber: callerPhoneNumber,
                callerSocketId: socket.id
            });
            console.log(`ጥሪ ከ ${callerPhoneNumber} ወደ ${targetPhoneNumber} ተልኳል`);
        } else {
            // ተጠቃሚው ኦንላይን ካልሆነ
            socket.emit('call-failed', { message: 'ተጠቃሚው ኦንላይን አይደለም ወይም አልተገኘም!' });
        }
    });

    // 3. ጥሪውን መቀበል (Answer Call)
    socket.on('accept-call', ({ callerSocketId, signal }) => {
        io.to(callerSocketId).emit('call-accepted', signal);
    });

    // 4. ተጠቃሚው ሲቋረጥ (Disconnect)
    socket.on('disconnect', () => {
        for (let phone in users) {
            if (users[phone] === socket.id) {
                delete users[phone];
                console.log(`ተጠቃሚ ወጥቷል (Disconnected): ${phone}`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

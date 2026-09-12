const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const users = {}; 

io.on('connection', (socket) => {
    console.log('ተጠቃሚ ተገናኝቷል (Connected):', socket.id);

    // 1. ስልክ ቁጥር መመዝገብ
    socket.on('register-phone', (phoneNumber) => {
        users[phoneNumber] = socket.id;
        console.log(`ስልክ ቁጥር ተመዝግቧል: ${phoneNumber} -> ሶኬት ID: ${socket.id}`);
    });

    // 2. ጥሪ መጀመር (Call User)
    socket.on('call-user', ({ targetPhoneNumber, callerPhoneNumber, offer }) => {
        const targetSocketId = users[targetPhoneNumber];

        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                callerPhoneNumber: callerPhoneNumber,
                callerSocketId: socket.id,
                offer: offer
            });
            console.log(`ጥሪ ከ ${callerPhoneNumber} ወደ ${targetPhoneNumber} ተልኳል`);
        } else {
            socket.emit('call-failed', { message: 'ተጠቃሚው ኦንላይን አይደለም ወይም አልተገኘም!' });
        }
    });

    // 3. ጥሪን መቀበል (Answer Call)
    socket.on('accept-call', ({ callerSocketId, answer }) => {
        io.to(callerSocketId).emit('call-accepted', { answer });
    });

    // 4. ICE Candidates መለዋወጥ
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
        io.to(targetSocketId).emit('ice-candidate', { candidate });
    });

    // 5. ሲቋረጥ (Disconnect)
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

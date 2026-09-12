const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// ተጠቃሚዎችን በስልክ ቁጥር እና ስም ለመያዝ
const users = {}; // format: { phoneNumber: { socketId, name } }

io.on('connection', (socket) => {
    console.log('ተጠቃሚ ተገናኝቷል (Connected):', socket.id);

    // 1. ስም እና ስልክ ቁጥር መመዝገብ
    socket.on('register-user', ({ phoneNumber, name }) => {
        users[phoneNumber] = { socketId: socket.id, name: name };
        console.log(`ተጠቃሚ ተመዝግቧል: ${name} (${phoneNumber}) -> ሶኬት ID: ${socket.id}`);
    });

    // 2. ጥሪ መጀመር (Call User)
    socket.on('call-user', ({ targetPhoneNumber, callerPhoneNumber, callerName, offer }) => {
        const targetUser = users[targetPhoneNumber];

        if (targetUser) {
            io.to(targetUser.socketId).emit('incoming-call', {
                callerPhoneNumber: callerPhoneNumber,
                callerName: callerName,
                callerSocketId: socket.id,
                offer: offer
            });
            console.log(`ጥሪ ከ ${callerName} (${callerPhoneNumber}) ወደ ${targetPhoneNumber} ተልኳል`);
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
            if (users[phone].socketId === socket.id) {
                console.log(`ተጠቃሚ ወጥቷል (Disconnected): ${users[phone].name} (${phone})`);
                delete users[phone];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

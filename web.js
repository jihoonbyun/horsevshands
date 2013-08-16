 
  var express = require('express'),
  app = express(),
	server = require('http').createServer(app), 
  io = require('socket.io').listen(server);
  app.set('port', 8001);
  server.listen(app.get('port'));

  // 8001 포트 사용
  server.listen(8001);

  // 스태틱 파일 설정
  app.use('/lib', express.static(__dirname + '/lib'));

	 // 스태틱 파일 설정
  app.use('/models', express.static(__dirname + '/models'));


  // 모바일 페이지 설정
  app.get('/phone', function (req, res) {
  res.sendfile(__dirname + '/phone.html');
  });

  // 소켓아이오 페이지 설정 ( 이렇게 할 필요는 없다. 그냥해봄)
 app.get('/socket', function (req, res) {
  res.sendfile(__dirname + '/socket.io.min.js');
  });

  // pc 오프닝 페이지 설정
  app.get('/opening', function (req, res) {
  res.sendfile(__dirname + '/opening.html');
  });


  // pc 인덱스 페이지 설정
  app.get('/index', function (req, res) {
  res.sendfile(__dirname + '/index.html');
  });

 // 광고  페이지 설정
  app.get('/developer', function (req, res) {
  res.sendfile(__dirname + '/developer.html');
  });



  // 소켓 통신으로 native websocket만 사용한다.
  io.configure(function () {
  
		io.set('transports', ['websocket']);
  
	});

 // 유저들 (폰과 연동된 사람들)
  var users = []
	
 // 클라이언트  세션 정보
  var opening_session;

	var index_session

	var phone_session

	// 세션과 닉네임 그리고 방
	var auth_session
	var nick
	var rooa

	var inTerval


  // 서버 소켓 대기
  io.sockets.on('connection', function(socket){


	  // 콘솔 확인	
		console.log("핸드쉐이크성공(서버)");

		// 클라이언트와 커넥트 되었을시 석세스 제이슨 보낸다
		socket.emit('connected', {connect : 'Connected!'});

		//오프닝 페이지로부터 세션아이디를 받는다
		//이는 나중에 인덱스 클라이언트 입장여부를 결정할때 조건이다
		socket.on('opening-session', function(data){

			opening_session = data;
			console.log("이게보입니까" + opening_session);

		});

		
		// 폰이 접속하면, 폰으로부터 닉네임을 받는다
		// 그리고 고유의 방을 생성한다 
		socket.on('individual', function(data){

		// 싱글 플레일 경우	
		if(data.ismulti == "false"){	
			
		// 소켓세션 정보를 닉넴으로  저장한다.
		auth_session = data.session;

		// 방을 생성하는 동시에 방에 접속한다
		socket.join(auth_session);

		// 폰세션을 따로 저장한다
		phone_session = data.session

		// 유저배열에 저장한다
		users.push(auth_session);

		// 콘솔
		console.log("방생성 완료. 폰접속 완료");

		// 오프닝 클라이언트에 화면 전환을 요구한다
		// 여기서 브로드캐스팅의 의미가 중요하다
		// 현재 대기중인 오프닝페이지들 즉, 현재 오프닝페이지를 켜놓고 있는
		// 모든사람들에게 메시지를 보내는것이다
		// 물론 오프닝페이지내부에서 현재 자신의 세션과 서버가 저장한 세션이
		// 일치할때만 응답이 오도록 설정해놓았다.
		socket.broadcast.emit('pcready', opening_session);

		}
	
		});

		
	 // 오프닝 클라이언트 인증이 끝나면 오프닝클라이언트를 방에 조인시킨다	
		socket.on('opening-join',function(){

			socket.join(auth_session);
			console.log("오프닝클라이언트 접속 완료");

		});

		// index 클라이언트로부터 방입장 요청을 받았다
		// 확인후 입장시킨다
			socket.on('gimme-nick', function(data){
			 
				if(auth_session == null || auth_session == "undefined"){		
				
				 socket.emit('un-normal-access');
				
				}
			
			 else { 
				 	socket.join(auth_session);
					index_session = data
					socket.emit('pc-success');
			 } 

		// 인덱스 클라이언트로부터  응답을받고, 이제 다시 폰에 레디를 보낸다.
		// 모든 클라이언트가 초기 폰세션의 이름으로된 방에 입장하였다
		socket.on('thankyou', function(data){
			
		 if(data == "no"){	
			
		 inTerval = setInterval(function(){
			socket.broadcast.to(auth_session).emit('gimme-speed')}, 500
			);
		 }

		 if(data == "yes"){
			
			 clearInterval(inTerval);
		 }

		});

	});	 //gimme-nick index 와 대화 종료후 폰으로 데이터 전송
	 	// 폰으로부터 받은 마력정보를 index 클라이언트에 보낸다
	 socket.on('heres-speed', function(data){
			//console.log("이게보이면 뭐게?");
		  //console.log(data.speed);	

	   socket.broadcast.to(auth_session).emit('letsgo', data);
		 socket.on('please-stop', function(){

			 		clearInterval(inTerval);

		 });

   });

  
	 socket.on('disconnect', function(){

		if(socket.id !== opening_session){

		  console.log(socket.id);

		  socket.broadcast.in(auth_session).emit('dis', auth_session);
			clearInterval(inTerval);
		  delete users[auth_session];
		}
    });
	 });



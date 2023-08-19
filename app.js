const express = require("express");
const app = express();
const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;
const initializationAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running at http://localhost:3002/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializationAndServer();

const methodA = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
///API1
app.get("/players/", async (request, response) => {
  const getQuery = `
  SELECT 
  *
  FROM 
  player_details;`;
  const getResult = await db.all(getQuery);
  response.send(getResult.map((each) => methodA(each)));
});

///API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
  SELECT *
FROM player_details
WHERE player_id=${playerId};`;
  const method = (obj) => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  };
  const getResults = await db.get(getQuery);
  response.send(method(getResults));
});
///API3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
  UPDATE player_details
    SET  player_name='${playerName}'
    WHERE player_id=${playerId};`;

  const result = await db.run(updateQuery);
  response.send("Player Details Updated");
});

///API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
  SELECT *
FROM match_details
    WHERE 
    match_id=${matchId};`;
  const method = (obj) => {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    };
  };
  const getResults = await db.get(getQuery);
  response.send(method(getResults));
});
///API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
  SELECT *
    FROM player_match_score 
     NATURAL JOIN match_details
   WHERE
    player_id=${playerId}`;
  const method = (obj) => {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    };
  };
  const result = await db.all(getQuery);
  response.send(result.map((each) => method(each)));
});

//API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `SELECT  
 player_details.player_id AS playerId,
	player_details.player_name AS playerName
 FROM player_match_score NATURAL JOIN player_details
WHERE match_id=${matchId};`;
  const result = await db.all(getQuery);
  response.send(result);
});
///API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const result = await db.get(getQuery);
  response.send(result);
});
module.exports = app;

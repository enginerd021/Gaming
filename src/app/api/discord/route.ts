import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, matchId, team1Name, team2Name, tournamentName, message } = body;

    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    
    // Check if Discord Integration is configured. If not, run Simulation Mode.
    const isConfigured = token && guildId && token !== 'mock-token' && guildId !== 'mock-guild';

    if (!isConfigured) {
      console.log(`[DISCORD SIMULATION] Executing action: "${action}"`);
      if (action === 'create_channel') {
        const cleanT1 = (team1Name || 'T1').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        const cleanT2 = (team2Name || 'T2').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        const channelName = `match-${cleanT1}-vs-${cleanT2}`;
        
        // Return a mock channel link that is clean and styled
        return NextResponse.json({
          success: true,
          simulated: true,
          channelId: `mock-chan-${matchId}`,
          channelName,
          channelUrl: `https://discord.com/channels/mock-guild-id/mock-chan-${matchId}`,
          message: `[Simulated] Match lobby channel #${channelName} created successfully for ${tournamentName}.`
        });
      }

      if (action === 'send_ping') {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: `[Simulated] Ping sent to team members of ${team1Name} and ${team2Name}: "Your match is live in tournament ${tournamentName}!"`
        });
      }

      if (action === 'bracket_update') {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: `[Simulated] Bracket update broadcasted: "${message}"`
        });
      }

      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // --- REAL DISCORD INTEGRATION ---
    const headers = {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    };

    if (action === 'create_channel') {
      const cleanT1 = (team1Name || 'T1').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
      const cleanT2 = (team2Name || 'T2').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
      const channelName = `⚔-${cleanT1}-vs-${cleanT2}`;

      const url = `https://discord.com/api/v10/guilds/${guildId}/channels`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: channelName,
          type: 0, // GUILD_TEXT channel
          topic: `Match Lobby for ${team1Name} vs ${team2Name} in ${tournamentName}. Coordinate your game join details here!`,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Discord Channel Creation Failed:", errorText);
        throw new Error(`Discord channel creation failed with status ${res.status}`);
      }

      const channelData = await res.json();
      
      // Auto-post a welcome ping message inside the channel
      const msgUrl = `https://discord.com/api/v10/channels/${channelData.id}/messages`;
      await fetch(msgUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: `⚡ **Match Ready!** ⚡\n\n@here Teams **${team1Name}** and **${team2Name}**, your match in **${tournamentName}** is up!\nCoordinate your custom lobby lobby/passwords and play now!\n\nGood luck, have fun!`
        }),
      });

      return NextResponse.json({
        success: true,
        channelId: channelData.id,
        channelName: channelData.name,
        channelUrl: `https://discord.com/channels/${guildId}/${channelData.id}`,
      });
    }

    if (action === 'send_ping') {
      // Find a channel for bracket updates or custom webhook if provided
      // If we don't have a specific channel, post to the match channel if target is provided
      // For now, let's allow sending a general notification ping if channelId is supplied
      const { channelId: targetChannelId } = body;
      if (!targetChannelId) {
        return NextResponse.json({ error: "Missing channelId for send_ping" }, { status: 400 });
      }

      const msgUrl = `https://discord.com/api/v10/channels/${targetChannelId}/messages`;
      const res = await fetch(msgUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: `🔔 **Match Live Alert!** **${team1Name}** vs **${team2Name}** is now active in **${tournamentName}**! Head to your channel.`
        }),
      });

      return NextResponse.json({ success: res.ok });
    }

    if (action === 'bracket_update') {
      const { updateChannelId } = body;
      // Fallback to a general system announcement channel if defined in env
      const targetChannelId = updateChannelId || process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
      
      if (!targetChannelId) {
        // If not specified, we'll log it or report success as no channel is bound
        return NextResponse.json({ success: true, warning: "No announcement channel set, skipped posting." });
      }

      const msgUrl = `https://discord.com/api/v10/channels/${targetChannelId}/messages`;
      const res = await fetch(msgUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: `🏆 **Bracket Announcement:** ${message}`
        }),
      });

      return NextResponse.json({ success: res.ok });
    }

    return NextResponse.json({ error: "Action not supported" }, { status: 400 });

  } catch (err: any) {
    console.error("Error in Discord Integration Route:", err);
    return NextResponse.json({ error: err.message || "Discord API interaction failed." }, { status: 500 });
  }
}

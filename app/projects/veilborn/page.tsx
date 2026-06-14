import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { A, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Veilborn",
  cardDescription: "Infinite, AI-enhanced text RPG for the web.",
  description:
    "An infinitey scalable text-based RPG for the web. Combining the story depth of DnD campaigns, the character building of Soulslikes, and turn-based combat with a persistent, AI-driven world.",
  img: "/images/veilborn.jpg",
  url: "https://www.youtube.com/watch?v=Uxg6PTIyb9Y",
};

export default function Veilborn() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <Button asChild variant="link" className="p-0 mb-6">
        <Link
          href="https://www.youtube.com/watch?v=Uxg6PTIyb9Y&t=2s"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch the demo on YouTube
        </Link>
      </Button>
      
      <div className="text-gray-700 dark:text-gray-300">
        <P>
          Veilborn is an ambitious text-based RPG I built for the web. It combines
          turn-based combat with deep strategy, character building inspired by
          Soulslikes, and a persistent world where AI drives the storytelling and 
          world generation.
        </P>
        <P>
          This is essentially a technical demo of a system I{`'`}ve wanted to make
          for a long time: an AI-driven RPG with a fully bespoke game system
          designed to pair well with AI while still feeling like a proper video
          game.
        </P>
        <P>
          The main gameplay loop happens through chat as the player is placed in a
          world with real data backing its locations, characters, and items. You
          can navigate via text or by menu, and you can talk to or fight any NPC
          you come across. Each NPC has their own personality, goals, and
          inventory.
        </P>
        <P>
          All game assets (NPCs, locations, dungeons, weapons, consumables, armor,
          etc.) are nodes of data that exist in a database and are queried to
          generate the game world. This allows the world to scale effectively
          infinitely: assets can be vetted for quality and consistency by me,
          while also being mass-produced by AI since everything is text. Even the
          portraits were AI produced and those could all be generated on the fly
          as well.
        </P>
        <P>
          The leveling and progression system is heavily inspired by Souls games
          like Elden Ring and Dark Souls. Each weapon scales with the player
          character{`'`}s relevant stats (like strength or dexterity). This powers a
          bespoke turn-based combat system that{`'`}s meant to feel like a proper
          video game. One issue I had with many other AI-driven RPGs is that they
          feel like a text adventure rather than a proper game. In those systems
          no real state exists, and no actual mechanics are in place. That{`'`}s
          the main problem I wanted to solve with Veilborn.
        </P>
        <P>
          The game system is intelligent enough to determine when combat is
          initiated and which creatures are participating. It{`'`}s also intelligent
          enough to know when the player is intending to move, or interact with
          their inventory. These systems are powered by having mini agents
          listening to the game chat. Each agent has its own prompt, goal, and
          access to tools that directly affect the game state. They all run during
          normal gameplay after each message.
        </P>
        <P>
          I had a lot of fun building this, especially the game design work around
          how all the systems and mechanics tie together. Veilborn is at the
          intersection of my interests, I felt like a game designer programmer and
          dungeon master at the same time. Building Veilborn really stretched my
          systems thinking and software design skills. I had to design and build an
          entire game system from scratch while ensuring it was AI-compatible. It
          opens up a lot of interesting possibilities for the future of game
          design.
        </P>
        <P>
          The streaming chat system I wrote about in{" "}
          <A href="/blog/streamed-ai-response">Unbreakable AI Chat</A> powers the
          in-game dialog system.
        </P>
      </div>
    </ProjectLayout>
  );
}

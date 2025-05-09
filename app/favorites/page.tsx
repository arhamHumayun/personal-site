import { H1, Lead, P } from "@/components/typography";
import Link from "next/link";

const favoriteVideos = [
  {
    url: "https://www.youtube.com/watch?v=SxdOUGdseq4",
    description: "One of the most insightful talks I've ever seen. I come back to it occasionally.",
  },
  {
    url: "https://www.youtube.com/watch?v=KwBuV7YZido",
    description: "The single best video I have seen explaining data structures and how they're actually represented in memory. Nic Barker's entire channel is gold.",
  },
  {
    url: "https://www.youtube.com/watch?v=WwkuAqObplU",
    description: "Another excellent video from Nic Barker explaining Data Oriented Design and why it matters for performance.",
  },
  {
    url: "https://www.youtube.com/watch?v=mTa2d3OLXhg",
    description: "A long but extremely good interviewwith DHH and ThePrimeagen.",
  },
  {
    url: "https://www.youtube.com/watch?v=gcfB8iIPtbY",
    description: "Great explanation of cloud services from NeetCode.",
  },
  {
    url: "https://www.youtube.com/watch?v=tD5NrevFtbU",
    description: "A video on how clean code impacts performance by Casey Muratori. Super insightful.",
  },
];

const favoritePosts = [
  {
    label: "Parse, Don't Validate",
    url: "https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/",
    description: "A blog post about the importance of parsing over validating. I use this principle in my code all the time.",
  },
  {
    label: "I will dropkick you if you use that spreadsheet",
    url: "https://ludic.mataroa.blog/blog/i-will-fucking-dropkick-you-if-you-use-that-spreadsheet/",
    description: "A hilarious and very relatable blog post about the dangers of using spreadsheets as a data store as a software engineer.",
  },
  {
    label: "Things You Should Never Do, Part I",
    url: "https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/",
    description: "A classic article by Joel Spolsky about why rewriting code from scratch is usually a bad idea. This has influenced my approach to software development significantly.",
  },
  {
    label: "How Complex Systems Fail",
    url: "https://how.complexsystems.fail/",
    description: "A brilliant analysis of how complex systems fail and why they are inherently difficult to manage. This has shaped my understanding of system design and failure modes.",
  },
  {
    label: "Latency Numbers Every Programmer Should Know",
    url: "https://brenocon.com/dean_perf.html",
    description: "A classic reference showing the latency of various computer operations. I refer to this often when thinking about performance and system design.",
  },
  {
    label: "Centering in CSS: A Complete Guide",
    url: "https://www.joshwcomeau.com/css/center-a-div/",
    description: "An excellent guide by Josh Comeau explaining different ways to center elements in CSS, with clear explanations and visual examples.",
  },
  
];

function getYouTubeId(url: string) {
  // Handles both youtu.be and youtube.com URLs
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function Favorites() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center space-y-6 max-w-2xl w-full">
        <H1>Favorites</H1>
        <Lead>A collection of my favorite blog posts and YouTube videos.</Lead>
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-4">YouTube Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {favoriteVideos.map((fav) => {
                const videoId = getYouTubeId(fav.url);
                return (
                  <div key={fav.url} className="flex flex-col items-center border rounded-lg p-4 bg-card">
                    {videoId ? (
                      <div className="w-full aspect-video mb-2">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={fav.description}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg w-full h-full"
                        ></iframe>
                      </div>
                    ) : null}
                    <P className="text-sm text-muted-foreground mt-1">{fav.description}</P>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">Blog Posts</h2>
            <div className="space-y-4">
              {favoritePosts.map((fav) => (
                <div key={fav.url} className="border rounded-lg p-4 text-left bg-card">
                  <Link href={fav.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    {fav.label}
                  </Link>
                  <P className="text-sm text-muted-foreground mt-1">{fav.description}</P>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
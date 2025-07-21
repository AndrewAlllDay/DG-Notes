// src/components/NewsFeed.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';

// --- NEW: Default images for each source ---
const defaultImages = {
    Ultiworld: 'https://via.placeholder.com/1200x675/0B2C4A/FFFFFF?text=Ultiworld',
    DGPT: 'https://via.placeholder.com/1200x675/D91E2A/FFFFFF?text=Disc+Golf+Pro+Tour',
    PDGA: 'https://via.placeholder.com/1200x675/004C84/FFFFFF?text=PDGA',
    default: 'https://via.placeholder.com/1200x675.png?text=Disc+Golf+News'
};

const NewsFeed = () => {
    const [feedInfo, setFeedInfo] = useState({ title: 'Disc Golf News Feed', description: 'The latest from across the sport' });
    const [allItems, setAllItems] = useState([]);
    const [displayedItems, setDisplayedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const observer = useRef();
    const lastItemRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && allItems.length > displayedItems.length) {
                setIsLoading(true);
                setTimeout(() => {
                    setDisplayedItems(prev => allItems.slice(0, prev.length + 5));
                    setIsLoading(false);
                }, 300);
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, allItems, displayedItems]);

    useEffect(() => {
        const fetchAllFeeds = async () => {
            setIsLoading(true);
            setError(null);

            // --- NEW: Use an array of objects to track sources ---
            const feedSources = [
                { name: 'Ultiworld', url: 'https://discgolf.ultiworld.com/feed/' },
                { name: 'DGPT', url: 'https://www.dgpt.com/feed/' },
                { name: 'PDGA', url: 'https://www.pdga.com/frontpage/feed' }
            ];

            try {
                const responses = await Promise.all(
                    feedSources.map(source => {
                        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(source.url)}`;
                        // Return the response along with the source name
                        return fetch(proxyUrl).then(res => ({ res, sourceName: source.name }));
                    })
                );

                responses.forEach(({ res }) => {
                    if (!res.ok) throw new Error(`Network response was not ok. Status: ${res.status}`);
                });

                const allParsedItems = await Promise.all(
                    responses.map(async ({ res, sourceName }) => {
                        const text = await res.text();
                        const parser = new window.DOMParser();
                        const xmlDoc = parser.parseFromString(text, "application/xml");

                        return Array.from(xmlDoc.querySelectorAll('item')).map(item => {
                            let imageUrl = null;
                            const enclosure = item.querySelector('enclosure');
                            if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
                                imageUrl = enclosure.getAttribute('url');
                            }

                            if (!imageUrl) {
                                const descriptionHTML = item.querySelector('description')?.textContent || '';
                                const descParser = new window.DOMParser();
                                const descDoc = descParser.parseFromString(descriptionHTML, 'text/html');
                                const imageInDesc = descDoc.querySelector('img');
                                if (imageInDesc) {
                                    imageUrl = imageInDesc.getAttribute('src');
                                }
                            }

                            if (!imageUrl) {
                                const contentNamespace = 'http://purl.org/rss/1.0/modules/content/';
                                const contentEncodedNode = item.getElementsByTagNameNS(contentNamespace, 'encoded')[0];
                                const contentEncoded = contentEncodedNode ? contentEncodedNode.textContent : '';
                                const contentParser = new window.DOMParser();
                                const contentDoc = contentParser.parseFromString(contentEncoded, 'text/html');
                                const firstImage = contentDoc.querySelector('img');
                                imageUrl = firstImage ? firstImage.getAttribute('src') : null;
                            }

                            const descriptionHTML = item.querySelector('description')?.textContent || '';
                            const descParser = new window.DOMParser();
                            const descDoc = descParser.parseFromString(descriptionHTML, 'text/html');
                            descDoc.querySelectorAll('img').forEach(img => img.remove());
                            const cleanDescription = descDoc.body.innerHTML;

                            return {
                                guid: item.querySelector('guid')?.textContent || item.querySelector('link')?.textContent,
                                source: sourceName, // Tag the item with its source
                                title: item.querySelector('title')?.textContent || '',
                                link: item.querySelector('link')?.textContent || '',
                                description: cleanDescription,
                                published: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
                                imageUrl: imageUrl,
                            };
                        });
                    })
                );

                const combinedItems = allParsedItems.flat();
                const sortedItems = combinedItems.sort((a, b) => new Date(b.published) - new Date(a.published));
                const uniqueItems = Array.from(new Map(sortedItems.map(item => [item.guid, item])).values());

                setAllItems(uniqueItems);
                setDisplayedItems(uniqueItems.slice(0, 5));

            } catch (e) {
                console.error('Failed to fetch or parse RSS feeds:', e);
                setError('Failed to load the news feed. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllFeeds();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-center pt-5 mb-2">{feedInfo.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{feedInfo.description}</p>

            {isLoading && displayedItems.length === 0 && <div className="text-center p-4">Loading news...</div>}

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
                {displayedItems.map((item, index) => (
                    <li
                        ref={displayedItems.length === index + 1 ? lastItemRef : null}
                        key={item.guid}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col"
                    >
                        <img
                            // --- NEW: Select default image based on source ---
                            src={item.imageUrl || defaultImages[item.source] || defaultImages.default}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                            loading="lazy"
                        />
                        <div className="p-4 flex flex-col flex-grow">
                            <h2 className="text-lg font-semibold mb-2 flex-grow">
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    {item.title}
                                </a>
                            </h2>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 [&_a]:text-blue-500 [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: item.description }}
                            />
                            <p className="text-xs text-gray-500 mt-auto">
                                Published: {new Date(item.published).toLocaleString()}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>

            {isLoading && displayedItems.length > 0 && <div className="text-center p-4 col-span-full">Loading more...</div>}
            {error && !isLoading && <div className="p-4 text-center text-red-600 col-span-full">{error}</div>}
            {displayedItems.length > 0 && displayedItems.length === allItems.length && (
                <div className="text-center p-4 text-gray-500 col-span-full">You've reached the end!</div>
            )}
        </div>
    );
};

export default NewsFeed;
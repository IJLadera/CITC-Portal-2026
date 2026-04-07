import { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import CreatePost from '../pages/posts/createpost';

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-40"
                title="Create Post"
            >
                <FaPlus size={24} />
            </button>

            {/* Create Post Modal */}
            <CreatePost isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

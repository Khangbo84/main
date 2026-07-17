        function refreshPage() {
            location.reload();
        }

        function goToPage(page) {
            switch (page) {
                case 'maps':
                    window.location.href = "khangbo84.github.io/main/html/map.html";
                    break;
                case 'runestone':
                    window.location.href = "https://example.com/runestone";
                    break;
                case 'games':
                    window.location.href = "https://example.com/games";
                    break;
                case 'events':
                    window.location.href = "https://example.com/events";
                    break;
            }
        }

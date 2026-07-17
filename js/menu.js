        function refreshPage() {
            location.reload();
        }

        function goToPage(page) {
            switch (page) {
                case 'maps':
                    window.location.href = "https://khangbo84.github.io/main/html/map.html";
                    break;
                case 'runestone':
                    window.location.href = "https://khangbo84.github.io/main/html/runestones.html";
                    break;
                case 'games':
                    window.location.href = "https://khangbo84.github.io/main/html/games";
                    break;
                case 'events':
                    window.location.href = "https://khangbo84.github.io/main/html/server.html";
                    break;
                case 'betmc':
                    window.location.href = "https://khangbo84.github.io/main/html/bg_gen.html";
                    break;
                case 'wallpaper':
                    window.location.href = "https://khangbo84.github.io/main/html/wallpaper.html";
                    break;
            }
        }

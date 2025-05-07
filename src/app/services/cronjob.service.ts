import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { ShowtimeService } from './showtime.service';


@Injectable({
    providedIn: 'root'
})
export class CronService implements OnDestroy {
    private cronJobs: Map<string, Subscription> = new Map();
    private runningStatus = new BehaviorSubject<boolean>(false);

    constructor(private showtimeService: ShowtimeService) {
        console.log('CronService initialized');
    }






    // Phương thức mới để khởi động cronjob cập nhật showtime
    startShowtimeCronJob(intervalMs: number = 60000): void {
        this.registerJob('showtime-update', intervalMs, () => {
            console.log('Executing showtime cronjob...');
            this.showtimeService.showtimeCronJob().subscribe({
                next: () => console.log('Đã cập nhật lại dữ liệu trạng thái showtime + room + voucher'),
                error: (error) => console.error('Error updating showtime data:', error)
            });
        });
    }






    /**
     * Start a new cron job with specified interval in milliseconds
     * @param jobId Unique identifier for the job
     * @param intervalMs Interval in milliseconds
     * @param task Function to execute
     * @returns void
     */
    registerJob(jobId: string, intervalMs: number, task: () => void): void {
        // Clean up existing job with the same ID if exists
        if (this.cronJobs.has(jobId)) {
            this.stopJob(jobId);
        }

        // Create a new job
        const subscription = interval(intervalMs).subscribe(() => {
            task();
        });

        // Store the job
        this.cronJobs.set(jobId, subscription);

        // Update running status if this is the first job
        if (this.cronJobs.size === 1) {
            this.runningStatus.next(true);
        }

        console.log(`Cron job "${jobId}" registered with ${intervalMs}ms interval`);
    }

    /**
     * Stop a specific job
     * @param jobId ID of the job to stop
     */
    stopJob(jobId: string): void {
        const job = this.cronJobs.get(jobId);
        if (job) {
            job.unsubscribe();
            this.cronJobs.delete(jobId);
            console.log(`Cron job "${jobId}" stopped`);

            // Update running status if no jobs are left
            if (this.cronJobs.size === 0) {
                this.runningStatus.next(false);
            }
        }
    }

    /**
     * Stop all running cron jobs
     */
    stopAllJobs(): void {
        this.cronJobs.forEach((job, id) => {
            job.unsubscribe();
            console.log(`Cron job "${id}" stopped`);
        });

        this.cronJobs.clear();
        this.runningStatus.next(false);
        console.log('All cron jobs stopped');
    }

    /**
     * Check if a job is running
     * @param jobId ID of the job to check
     * @returns boolean - true if running
     */
    isJobRunning(jobId: string): boolean {
        return this.cronJobs.has(jobId);
    }

    /**
     * Get observable for the running status
     * @returns Observable<boolean>
     */
    getRunningStatus(): Observable<boolean> {
        return this.runningStatus.asObservable();
    }

    ngOnDestroy(): void {
        this.stopAllJobs();
    }
}
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('data-fetch') private dataFetchQueue: Queue,
    @InjectQueue('scraping') private scrapingQueue: Queue,
  ) {}

  /**
   * Add a job to fetch company data from free APIs
   */
  async enqueueCompanyDataFetch(companyId: string, ticker?: string) {
    this.logger.log(`Enqueuing company data fetch for: ${companyId}`);

    await this.dataFetchQueue.add(
      'fetch-company',
      { companyId, ticker },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  /**
   * Add a job to scrape investor portfolio
   */
  async enqueuePortfolioScraping(investorId: string, url: string, investorName?: string) {
    this.logger.log(`Enqueuing portfolio scraping for: ${investorName || investorId}`);

    const job = await this.scrapingQueue.add(
      'scrape-portfolio',
      { investorId, url, investorName },
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        timeout: 60000, // 1 minute timeout
      },
    );

    return job.id;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, queueName: 'data-fetch' | 'scraping') {
    const queue = queueName === 'data-fetch' ? this.dataFetchQueue : this.scrapingQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = await job.progress();

    return {
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: 'data-fetch' | 'scraping') {
    const queue = queueName === 'data-fetch' ? this.dataFetchQueue : this.scrapingQueue;

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}

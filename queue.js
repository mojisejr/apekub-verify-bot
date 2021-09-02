const Queue = require('bee-queue');
const queue = new Queue('example');

const job = queue.createJob({ x: 2, y: 3 });
job.save();

job.on('succeeded', (result) => {
  console.log(`Received result for job ${job.id}: ${result}`);
});

// Process jobs from as many servers or processes as you like
queue.process(function (job, done) {
  console.log(`Processing job ${job.id}`);
  job.reportProgress(100);
  return done();
});

queue.getJobs('succeeded', { start: 0, end: 25 }).then((jobs) => {
  const jobIds = jobs.map((job) => job.id);
  console.log(`Job ids: ${jobIds.join(' ')}`);
});